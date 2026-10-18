<?php

return ['default' => env('CACHE_STORE', 'redis'), 'stores' => ['array' => ['driver' => 'array', 'serialize' => false], 'redis' => ['driver' => 'redis', 'connection' => 'cache', 'lock_connection' => 'default']], 'prefix' => env('CACHE_PREFIX', 'africonnect_cache_')];
