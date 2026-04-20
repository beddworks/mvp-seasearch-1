<?php

namespace Database\Seeders;

use App\Models\CompensationType;
use App\Models\ExceptionRule;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. Admin user ─────────────────────────────────────────────────────
        $admin = User::firstOrCreate(
            ['email' => 'admin@seasearch.asia'],
            [
                'name'              => 'SeaSearch Admin',
                'email'             => 'admin@seasearch.asia',
                'password'          => Hash::make('password'),
                'role'              => 'admin',
                'status'            => 'active',
                'email_verified_at' => now(),
            ]
        );

        // ── 2. Compensation types ─────────────────────────────────────────────
        $types = [
            [
                'name'              => 'Percentage of Salary',
                'formula_type'      => 'percentage',
                'formula_fields'    => ['reward_pct' => 0.15, 'platform_fee_pct' => 0.20],
                'trigger_condition' => 'on_hire',
                'platform_fee_pct'  => 0.20,
                'sort_order'        => 1,
            ],
            [
                'name'              => 'Hourly Rate',
                'formula_type'      => 'hourly',
                'formula_fields'    => ['hourly_rate' => 0, 'hours_billed' => 0, 'platform_fee_pct' => 0.20],
                'trigger_condition' => 'on_invoice',
                'platform_fee_pct'  => 0.20,
                'sort_order'        => 2,
            ],
            [
                'name'              => 'Fixed Fee',
                'formula_type'      => 'fixed',
                'formula_fields'    => ['fixed_amount' => 0, 'platform_fee_pct' => 0.20],
                'trigger_condition' => 'on_hire',
                'platform_fee_pct'  => 0.20,
                'sort_order'        => 3,
            ],
            [
                'name'              => 'Per Project / Milestone',
                'formula_type'      => 'milestone',
                'formula_fields'    => ['milestones' => [], 'platform_fee_pct' => 0.20],
                'trigger_condition' => 'on_milestone',
                'platform_fee_pct'  => 0.20,
                'sort_order'        => 4,
            ],
        ];

        foreach ($types as $type) {
            CompensationType::firstOrCreate(
                ['formula_type' => $type['formula_type']],
                array_merge($type, ['formula_fields' => json_encode($type['formula_fields'])])
            );
        }

        // ── 3. Default exception rule: trusted recruiter bypass ───────────────
        ExceptionRule::firstOrCreate(
            ['rule_type' => 'recruiter_trust'],
            [
                'name'        => 'Trusted Recruiter Bypass',
                'description' => 'Recruiters with trust_level = trusted bypass admin CDD review.',
                'is_active'   => true,
                'rule_type'   => 'recruiter_trust',
                'trust_level' => 'trusted',
                'created_by'  => $admin->id,
            ]
        );

        $this->command->info('✓ Admin user: admin@seasearch.asia / password');
        $this->command->info('✓ 4 compensation types seeded.');
        $this->command->info('✓ Exception rule (trusted bypass) seeded.');

        $this->call(ComprehensiveSeeder::class);
    }
}
