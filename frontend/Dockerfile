# Frontend is just a static HTML file
# No build step needed at all — that's the beauty of plain HTML
# We just copy the file into an Nginx container

FROM nginx:1.25-alpine

# Remove default nginx page
RUN rm -rf /usr/share/nginx/html/*

# Copy our HTML file
COPY index.html /usr/share/nginx/html/index.html

# Copy our custom nginx config
# This replaces the default nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]