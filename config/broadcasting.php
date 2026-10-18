<?php

return ['default' => env('BROADCAST_CONNECTION', 'reverb'), 'connections' => ['reverb' => ['driver' => 'reverb', 'key' => env('REVERB_APP_KEY', 'local-key'), 'secret' => env('REVERB_APP_SECRET', 'local-secret-change-me'), 'app_id' => env('REVERB_APP_ID', 'local-app'), 'options' => ['host' => env('REVERB_HOST', '127.0.0.1'), 'port' => env('REVERB_PORT', 8080), 'scheme' => env('REVERB_SCHEME', 'http'), 'useTLS' => env('REVERB_SCHEME', 'http') === 'https'], 'client_options' => []], 'log' => ['driver' => 'log'], 'null' => ['driver' => 'null']]];
