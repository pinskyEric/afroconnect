FROM php:8.3-fpm-alpine
RUN apk add --no-cache nginx postgresql-dev libzip-dev icu-dev oniguruma-dev libpng-dev libjpeg-turbo-dev freetype-dev $PHPIZE_DEPS \
 && docker-php-ext-configure gd --with-freetype --with-jpeg && docker-php-ext-install pdo_pgsql bcmath intl pcntl zip opcache gd \
 && pecl install redis && docker-php-ext-enable redis
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /var/www/html
COPY composer.json ./
RUN composer install --no-dev --no-interaction --prefer-dist --no-scripts --no-autoloader
COPY . .
RUN composer dump-autoload --optimize --no-dev \
 && chown -R www-data:www-data storage bootstrap/cache
COPY docker/nginx.conf /etc/nginx/http.d/default.conf
EXPOSE 8080
CMD ["sh","-c","php artisan package:discover --ansi && php artisan config:cache && php-fpm -D && nginx -g 'daemon off;'"]