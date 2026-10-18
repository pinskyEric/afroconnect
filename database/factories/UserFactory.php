<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    protected $model = User::class;

    protected static ?string $password = null;

    public function definition(): array
    {
        return ['name' => fake()->firstName(), 'username' => Str::lower(fake()->unique()->userName()).Str::random(3), 'email' => fake()->unique()->safeEmail(), 'email_verified_at' => now(), 'password' => static::$password ??= bcrypt('Local-Only-Fictional-123!'), 'birth_date' => fake()->dateTimeBetween('-40 years', '-20 years')->format('Y-m-d'), 'country' => fake()->randomElement(['Uganda', 'Kenya', 'Ghana', 'Rwanda']), 'languages' => ['English'], 'interests' => ['Music'], 'bio' => fake()->sentence(), 'online' => false, 'role' => 'user', 'status' => 'active'];
    }
}
