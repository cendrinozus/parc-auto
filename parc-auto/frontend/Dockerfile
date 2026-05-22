FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM httpd:2.4
COPY --from=builder /app/dist /usr/local/apache2/htdocs/
COPY ssl.conf /usr/local/apache2/conf/extra/ssl.conf

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/* && \
    mkdir -p /etc/ssl/parc-auto && \
    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
        -keyout /etc/ssl/parc-auto/parc-auto.key \
        -out /etc/ssl/parc-auto/parc-auto.crt \
        -subj "/CN=parc-auto/O=CIPRES/C=FR"

RUN sed -i 's/^#\(LoadModule ssl_module\)/\1/' /usr/local/apache2/conf/httpd.conf && \
    sed -i 's/^#\(LoadModule socache_shmcb_module\)/\1/' /usr/local/apache2/conf/httpd.conf && \
    echo "LoadModule rewrite_module modules/mod_rewrite.so" >> /usr/local/apache2/conf/httpd.conf && \
    echo "LoadModule proxy_module modules/mod_proxy.so" >> /usr/local/apache2/conf/httpd.conf && \
    echo "LoadModule proxy_http_module modules/mod_proxy_http.so" >> /usr/local/apache2/conf/httpd.conf && \
    echo "Include conf/extra/ssl.conf" >> /usr/local/apache2/conf/httpd.conf && \
    sed -i 's/AllowOverride None/AllowOverride All/g' /usr/local/apache2/conf/httpd.conf

EXPOSE 80 443
