<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserActivity;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminLoginControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_successful_admin_login_is_logged()
    {
        $admin = User::factory()->create([
            'is_admin' => true,
            'is_active' => true,
            'password' => bcrypt('password'),
        ]);

        $response = $this->post(route('admin.login'), [
            'email' => $admin->email,
            'password' => 'password',
        ]);

        $response->assertRedirect(route('admin.dashboard'));
        $this->assertDatabaseHas('user_activities', [
            'user_id' => $admin->id,
            'activity_type' => 'admin_login',
            'description' => 'Successful login to admin portal',
        ]);
    }

    public function test_failed_admin_login_is_logged()
    {
        $response = $this->post(route('admin.login'), [
            'email' => 'wrong@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertDatabaseHas('user_activities', [
            'activity_type' => 'login_failed',
            'description' => 'Failed admin login attempt for email: wrong@example.com',
        ]);
    }

    public function test_non_admin_login_to_admin_portal_is_logged_as_security_alert()
    {
        $user = User::factory()->create([
            'is_admin' => false,
            'is_active' => true,
            'password' => bcrypt('password'),
        ]);

        $response = $this->post(route('admin.login'), [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertDatabaseHas('user_activities', [
            'user_id' => $user->id,
            'activity_type' => 'security_alert',
            'description' => 'Unauthorized admin login attempt',
        ]);
    }
}
