<?php

return ['reverb' => ['app_id' => env('REVERB_APP_ID'), 'key' => env('REVERB_APP_KEY'), 'secret' => env('REVERB_APP_SECRET'), 'options' => ['host' => env('REVERB_HOST'), 'port' => env('REVERB_PORT', 8080), 'scheme' => env('REVERB_SCHEME', 'http'), 'useTLS' => env('REVERB_SCHEME', 'http') === 'https']]];
