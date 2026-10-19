FROM nginx:alpine
COPY dist/site /usr/share/nginx/html
EXPOSE 80
