pipeline {
    agent any

    environment {
        // Jenkins credential IDs — we will create these in Jenkins UI
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-creds')
        GIT_CREDENTIALS_ID    = 'github-creds'

        // Change these to your actual values
        DOCKERHUB_USER   = 'ankitakumari346'
        GITOPS_REPO_URL  = 'https://github.com/ankitakumari11/todo-gitops.git'

        // Image names — will be tagged with Jenkins BUILD_NUMBER
        BACKEND_IMAGE  = "${DOCKERHUB_USER}/todo-backend"
        FRONTEND_IMAGE = "${DOCKERHUB_USER}/todo-frontend"
    }

    tools {
        // 'nodejs-18' must match the name you set in
        // Jenkins > Manage Jenkins > Global Tool Configuration > NodeJS
        nodejs 'nodejs-18'
    }

    stages {

        // -------------------------------------------------------
        // STAGE 1: CHECKOUT
        // Jenkins pulls the latest code from GitHub
        // This is triggered automatically by a GitHub webhook
        // -------------------------------------------------------
        stage('Checkout') {
            steps {
                echo '📥 Stage 1: Pulling source code from GitHub...'
                checkout scm
                // 'scm' means "use the repo configured in this Jenkins job"
                // Jenkins automatically knows which branch triggered the build
            }
        }

        // -------------------------------------------------------
        // STAGE 2: INSTALL DEPENDENCIES
        // Run npm ci (clean install) for backend
        // 'npm ci' is preferred over 'npm install' in CI pipelines
        // because it installs exact versions from package-lock.json
        // ensuring reproducible builds every time
        // -------------------------------------------------------
        stage('Install Dependencies') {
            steps {
                echo '📦 Stage 2: Installing backend dependencies...'
                dir('backend') {
                    sh 'npm ci'
                    // npm ci = clean install
                    // Always installs exact versions from package-lock.json
                    // Fails if package-lock.json is out of sync (good for CI)
                }
                // Frontend has no dependencies — it's plain HTML
                // Nothing to install for frontend!
            }
        }

        // -------------------------------------------------------
        // STAGE 3: RUN TESTS
        // Jest runs our unit tests
        // --coverage flag generates a coverage report
        // Jenkins will fail this stage if any test fails
        // Pipeline stops here — bad code never gets dockerized
        // -------------------------------------------------------
        stage('Run Tests') {
            steps {
                echo '🧪 Stage 3: Running backend unit tests...'
                dir('backend') {
                    sh 'npm test'
                    // This runs: jest --coverage --forceExit --detectOpenHandles
                    // Output: coverage/lcov.info (used by SonarQube later)
                    // Output: test results (pass/fail per test case)
                }
            }
        }

        // -------------------------------------------------------
        // STAGE 4: SONARQUBE ANALYSIS
        // Scans code for bugs, vulnerabilities, code smells
        // Uses the coverage report from Stage 3
        // 'sonarqube-server' = the SonarQube server name configured
        // in Jenkins > Manage Jenkins > Configure System
        // -------------------------------------------------------
        stage('SonarQube Analysis') {
            steps {
                echo '🔍 Stage 4: Running SonarQube static code analysis...'
                withSonarQubeEnv('sonarqube-server') {
                    // withSonarQubeEnv automatically injects:
                    // SONAR_HOST_URL and SONAR_AUTH_TOKEN as env vars
                    sh '''
                        cd backend
                        npx sonar-scanner \
                          -Dsonar.projectKey=todo-app \
                          -Dsonar.sources=src \
                          -Dsonar.tests=tests \
                          -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
                    '''
                // 1. Reads your code (src/)
                // 2. Reads test folder (tests/)
                // 3. Reads coverage file (coverage/lcov.info)
                // 4. Analyzes code quality
                // 5. Sends results to SonarQube server
                }
            }
        }

        // -------------------------------------------------------
        // STAGE 5: QUALITY GATE
        // Waits for SonarQube to finish analysis
        // and checks if the code passed the Quality Gate
        // Quality Gate = set of conditions (coverage %, no critical bugs etc.)
        // If gate FAILS → pipeline aborts → code never gets deployed
        // This is the "shift left" security/quality principle
        // -------------------------------------------------------
        stage('Quality Gate') {
            steps {
                echo '🚦 Stage 5: Checking SonarQube Quality Gate result...'
                timeout(time: 5, unit: 'MINUTES') {
                    // Wait up to 5 mins for SonarQube to respond
                    // abortPipeline: true means fail the build if gate fails
                    waitForQualityGate abortPipeline: true
                }
            }
        }
        // 👉 In SonarQube, a Quality Gate is a set of rules like:
        // Coverage ≥ 80%
        // No critical bugs
        // No security vulnerabilities
        // 👉 If rules pass → OK
        // 👉 If not → FAIL

        // -------------------------------------------------------
        // STAGE 6: DOCKER BUILD
        // Builds Docker images for both frontend and backend
        // Tags with both BUILD_NUMBER (unique) and 'latest'
        // BUILD_NUMBER (e.g. 42) lets us track exactly which
        // Jenkins build produced which Docker image
        // ArgoCD will use the BUILD_NUMBER tag (not 'latest')
        // so we always know exactly what version is deployed
        // -------------------------------------------------------
        stage('Docker Build') {
            steps {
                echo '🐳 Stage 6: Building Docker images...'
                sh """
                    # Build backend image
                    docker build \
                      -t ${BACKEND_IMAGE}:${BUILD_NUMBER} \
                      -t ${BACKEND_IMAGE}:latest \
                      ./backend

                    # Build frontend image
                    docker build \
                      -t ${FRONTEND_IMAGE}:${BUILD_NUMBER} \
                      -t ${FRONTEND_IMAGE}:latest \
                      ./frontend
                """
                // The BUILD_NUMBER is automatically generated by Jenkins for each pipeline run, enabling version control and rollback capabilities.
            }
        }

        // -------------------------------------------------------
        // STAGE 7: PUSH TO DOCKERHUB
        // Logs into DockerHub using credentials stored in Jenkins
        // (never hardcoded in Jenkinsfile)
        // Pushes both tags for both images
        // -------------------------------------------------------
        stage('Push to DockerHub') {
            steps {
                echo '📤 Stage 7: Pushing images to DockerHub...'
                sh """
                    # Login using Jenkins credential (never plain text)
                    echo ${DOCKERHUB_CREDENTIALS_PSW} | \
                    docker login -u ${DOCKERHUB_CREDENTIALS_USR} --password-stdin

                    docker push ${BACKEND_IMAGE}:${BUILD_NUMBER}
                    docker push ${BACKEND_IMAGE}:latest

                    docker push ${FRONTEND_IMAGE}:${BUILD_NUMBER}
                    docker push ${FRONTEND_IMAGE}:latest
                """
            }
        }

        // -------------------------------------------------------
        // STAGE 8: UPDATE GITOPS REPO
        // This is the bridge between CI and CD
        // Jenkins updates the image tag in the todo-gitops repo
        // ArgoCD watches todo-gitops and sees the change
        // ArgoCD then deploys the new image to Kubernetes
        // Jenkins NEVER runs kubectl — ArgoCD handles all deploys
        // This separation is the GitOps principle
        // -------------------------------------------------------
        stage('Update GitOps Repo') {
            steps {
                echo '📝 Stage 8: Updating image tags in GitOps repo...'
                withCredentials([usernamePassword(
                    credentialsId: "${GIT_CREDENTIALS_ID}",
                    usernameVariable: 'GIT_USER',
                    passwordVariable: 'GIT_TOKEN'
                )]) {
                    sh """
                        # Clone the gitops repo
                        rm -rf todo-gitops
                        git clone https://${GIT_USER}:${GIT_TOKEN}@github.com/ankitakumari11/todo-gitops.git
                        cd todo-gitops

                        # Replace old image tag with new BUILD_NUMBER
                        # Example: image: youruser/todo-backend:41
                        # becomes: image: youruser/todo-backend:42
                        sed -i "s|image: ${BACKEND_IMAGE}:.*|image: ${BACKEND_IMAGE}:${BUILD_NUMBER}|g" \
                            manifests/backend-deployment.yaml

                        sed -i "s|image: ${FRONTEND_IMAGE}:.*|image: ${FRONTEND_IMAGE}:${BUILD_NUMBER}|g" \
                            manifests/frontend-deployment.yaml

                        # Commit and push the change
                        git config user.email "jenkins@todo-app.com"
                        git config user.name "Jenkins CI"
                        git add .
                        git commit -m "ci: bump image tags to build #${BUILD_NUMBER} [skip ci]"
                        # [skip ci] prevents this commit from triggering another build
                        git push origin main
                    """
                }
            }
        }
    }

    // -------------------------------------------------------
    // POST ACTIONS
    // These run regardless of whether pipeline passed or failed
    // Always logout from Docker and clean workspace
    // cleanWs() deletes all files Jenkins downloaded for this build
    // Prevents disk filling up on Jenkins server over time
    // -------------------------------------------------------
    post {
        success {
            echo '''
            ✅ Pipeline SUCCESS!
            New images pushed to DockerHub.
            GitOps repo updated.
            ArgoCD will now detect the change and deploy to Kubernetes automatically.
            '''
        }
        failure {
            echo '''
            ❌ Pipeline FAILED!
            Check the stage that failed above.
            No new images were deployed to Kubernetes.
            '''
        }
        always {
            sh 'docker logout || true'
            cleanWs()
        }
    }
}