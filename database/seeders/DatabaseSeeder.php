<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->environment('production')) {
            return;
        }foreach ([['Demo Alex', 'alex.demo', 'alex@example.test', 'Uganda', ['English', 'Luganda'], ['Music', 'Travel']], ['Demo Amina', 'amina.demo', 'amina@example.test', 'Uganda', ['English', 'Luganda'], ['Travel', 'Photography']], ['Demo Kwame', 'kwame.demo', 'kwame@example.test', 'Ghana', ['English', 'Twi'], ['Music', 'Technology']]] as [$name,$handle,$email,$country,$languages,$interests]) {
            User::firstOrCreate(['email' => $email], ['name' => $name, 'username' => $handle, 'password' => 'Local-Only-Fictional-123!', 'birth_date' => '1998-05-20', 'country' => $country, 'languages' => $languages, 'interests' => $interests, 'bio' => 'Fictional seed profile for local testing. No real person is represented.', 'role' => 'user', 'status' => 'active']);
        }
    }
}
