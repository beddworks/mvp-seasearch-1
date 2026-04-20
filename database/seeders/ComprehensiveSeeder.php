<?php

namespace Database\Seeders;

use App\Models\Candidate;
use App\Models\CddSubmission;
use App\Models\Client;
use App\Models\CompensationType;
use App\Models\Mandate;
use App\Models\MandateClaim;
use App\Models\Placement;
use App\Models\Recruiter;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ComprehensiveSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@seasearch.asia')->first();
        $compPct = CompensationType::where('formula_type', 'percentage')->first();
        $compFixed = CompensationType::where('formula_type', 'fixed')->first();

        // ── 1. RECRUITERS ─────────────────────────────────────────────────────

        $r1User = User::firstOrCreate(
            ['email' => 'priya.sharma@recruiter.sea'],
            [
                'name'              => 'Priya Sharma',
                'password'          => Hash::make('password'),
                'role'              => 'recruiter',
                'status'            => 'active',
                'email_verified_at' => now(),
            ]
        );
        $r1 = Recruiter::firstOrCreate(['user_id' => $r1User->id], [
            'display_name'        => 'Priya Sharma',
            'phone'               => '+65 9123 4567',
            'linkedin_url'        => 'https://linkedin.com/in/priya-sharma-sg',
            'bio'                 => 'Senior executive headhunter with 12 years specialising in financial services and fintech across Singapore, Indonesia, and Vietnam. Former Big-4 consultant turned recruiter. Known for C-suite and VP-level placements.',
            'years_experience'    => 12,
            'current_firm'        => 'Apex Executive Search',
            'ea_license_number'   => 'R1234567',
            'profile_complete'    => true,
            'recruiter_group'     => 'Dwikar',
            'tier'                => 'elite',
            'trust_level'         => 'trusted',
            'industries'          => ['Financial Services', 'Fintech', 'Banking'],
            'seniority_focus'     => ['c_suite', 'vp_director'],
            'geographies'         => ['Singapore', 'Indonesia', 'Vietnam'],
            'specialty'           => 'C-Suite & VP-level placements in financial services',
            'total_placements'    => 28,
            'total_earnings'      => 312000.00,
            'active_mandates_count' => 1,
        ]);

        $r2User = User::firstOrCreate(
            ['email' => 'marcus.tan@recruiter.sea'],
            [
                'name'              => 'Marcus Tan',
                'password'          => Hash::make('password'),
                'role'              => 'recruiter',
                'status'            => 'active',
                'email_verified_at' => now(),
            ]
        );
        $r2 = Recruiter::firstOrCreate(['user_id' => $r2User->id], [
            'display_name'        => 'Marcus Tan',
            'phone'               => '+65 8234 5678',
            'linkedin_url'        => 'https://linkedin.com/in/marcus-tan-sea',
            'bio'                 => 'Specialised in technology and e-commerce leadership hiring across SEA. 8 years placing Engineering Heads, CTOs, and Product leaders for Series B–D startups and regional tech firms.',
            'years_experience'    => 8,
            'current_firm'        => 'TalentBridge SEA',
            'ea_license_number'   => 'R2345678',
            'profile_complete'    => true,
            'recruiter_group'     => 'Emma',
            'tier'                => 'senior',
            'trust_level'         => 'standard',
            'industries'          => ['Technology', 'E-commerce', 'SaaS'],
            'seniority_focus'     => ['vp_director', 'manager'],
            'geographies'         => ['Singapore', 'Malaysia', 'Thailand'],
            'specialty'           => 'Tech leadership for high-growth startups',
            'total_placements'    => 14,
            'total_earnings'      => 148500.00,
            'active_mandates_count' => 2,
        ]);

        $r3User = User::firstOrCreate(
            ['email' => 'linh.nguyen@recruiter.sea'],
            [
                'name'              => 'Linh Nguyen',
                'password'          => Hash::make('password'),
                'role'              => 'recruiter',
                'status'            => 'active',
                'email_verified_at' => now(),
            ]
        );
        $r3 = Recruiter::firstOrCreate(['user_id' => $r3User->id], [
            'display_name'        => 'Linh Nguyen',
            'phone'               => '+84 90 123 4567',
            'linkedin_url'        => 'https://linkedin.com/in/linh-nguyen-vn',
            'bio'                 => 'Vietnam-based headhunter with deep networks in FMCG, retail, and consumer goods. Focuses on country manager and regional director roles for MNCs entering or expanding in Vietnam.',
            'years_experience'    => 6,
            'current_firm'        => 'VN Executive Talent',
            'ea_license_number'   => null,
            'profile_complete'    => true,
            'recruiter_group'     => 'BTI',
            'tier'                => 'junior',
            'trust_level'         => 'standard',
            'industries'          => ['FMCG', 'Retail', 'Consumer Goods'],
            'seniority_focus'     => ['vp_director', 'manager'],
            'geographies'         => ['Vietnam', 'Cambodia', 'Laos'],
            'specialty'           => 'MNC market-entry leadership in Vietnam',
            'total_placements'    => 7,
            'total_earnings'      => 62400.00,
            'active_mandates_count' => 1,
        ]);

        // ── 2. CLIENTS ────────────────────────────────────────────────────────

        // Client 1: Grab Financial Group
        $c1User = User::firstOrCreate(
            ['email' => 'hiring@grabfinancial.com'],
            [
                'name'              => 'Sandra Lim',
                'password'          => Hash::make('password'),
                'role'              => 'client',
                'status'            => 'active',
                'email_verified_at' => now(),
            ]
        );
        $client1 = Client::firstOrCreate(
            ['contact_email' => 'hiring@grabfinancial.com'],
            [
                'user_id'        => $c1User->id,
                'company_name'   => 'Grab Financial Group',
                'industry'       => 'Fintech',
                'accent_color'   => '#00B14F',
                'website'        => 'https://www.grab.com/sg/grabfinancial/',
                'contact_name'   => 'Sandra Lim',
                'contact_title'  => 'VP Talent Acquisition',
                'status'         => 'active',
            ]
        );

        // Client 2: Sea Limited
        $c2User = User::firstOrCreate(
            ['email' => 'talent@sea.com'],
            [
                'name'              => 'James Wong',
                'password'          => Hash::make('password'),
                'role'              => 'client',
                'status'            => 'active',
                'email_verified_at' => now(),
            ]
        );
        $client2 = Client::firstOrCreate(
            ['contact_email' => 'talent@sea.com'],
            [
                'user_id'        => $c2User->id,
                'company_name'   => 'Sea Limited',
                'industry'       => 'Technology',
                'accent_color'   => '#FF4D00',
                'website'        => 'https://www.sea.com',
                'contact_name'   => 'James Wong',
                'contact_title'  => 'Director, Executive Talent',
                'status'         => 'active',
            ]
        );

        // Client 3: Unilever SEA
        $c3User = User::firstOrCreate(
            ['email' => 'exec.talent@unilever-sea.com'],
            [
                'name'              => 'Rachel Pham',
                'password'          => Hash::make('password'),
                'role'              => 'client',
                'status'            => 'active',
                'email_verified_at' => now(),
            ]
        );
        $client3 = Client::firstOrCreate(
            ['contact_email' => 'exec.talent@unilever-sea.com'],
            [
                'user_id'        => $c3User->id,
                'company_name'   => 'Unilever SEA',
                'industry'       => 'FMCG',
                'accent_color'   => '#1F36C7',
                'website'        => 'https://www.unilever.com.sg',
                'contact_name'   => 'Rachel Pham',
                'contact_title'  => 'Regional HR Director',
                'status'         => 'active',
            ]
        );

        // ── 3. MANDATES ───────────────────────────────────────────────────────

        // Mandate 1: Grab — Chief Risk Officer (active, assigned to Priya)
        $mandate1 = Mandate::firstOrCreate(
            ['title' => 'Chief Risk Officer', 'client_id' => $client1->id],
            [
                'client_id'              => $client1->id,
                'posted_by_user_id'      => $admin->id,
                'compensation_type_id'   => $compPct->id,
                'title'                  => 'Chief Risk Officer',
                'description'            => '<p><strong>About the Role</strong></p><p>Grab Financial Group is seeking an experienced Chief Risk Officer to lead enterprise risk management across our lending, insurance, and payments verticals in Southeast Asia. The CRO will report directly to the CEO and work with regulators across 8 markets.</p><p><strong>Key Responsibilities</strong></p><ul><li>Own the full risk framework — credit, market, operational, and regulatory risk</li><li>Lead a 40-person risk team across Singapore, Indonesia, and Vietnam</li><li>Interface with MAS, OJK, and regional financial regulators</li><li>Drive risk-adjusted growth strategy in partnership with the CFO</li></ul><p><strong>Requirements</strong></p><ul><li>15+ years in financial risk at a bank, regulator, or major fintech</li><li>Deep knowledge of SEA regulatory landscape</li><li>Experience managing large cross-functional risk teams</li></ul>',
                'location'               => 'Singapore',
                'seniority'              => 'c_suite',
                'industry'               => 'Fintech',
                'contract_type'          => 'full_time',
                'openings_count'         => 1,
                'is_remote'              => false,
                'salary_min'             => 420000.00,
                'salary_max'             => 560000.00,
                'salary_currency'        => 'SGD',
                'reward_min'             => 63000.00,
                'reward_max'             => 84000.00,
                'reward_pct'             => 0.15,
                'must_haves'             => ['15+ years financial risk experience', 'SEA regulatory experience', 'C-suite leadership'],
                'nice_to_haves'          => ['MAS regulated entity background', 'Bilingual Mandarin/English', 'Lending or insurance risk background'],
                'green_flags'            => ['Big-4 bank CRO or deputy CRO background', 'Previous MAS or OJK interaction', 'Led teams of 30+ people'],
                'red_flags'              => ['No SEA experience', 'Less than 10 years in risk', 'Pure consulting background with no operational role'],
                'screening_questions'    => [
                    ['question' => 'Describe your experience managing enterprise risk across multiple SEA jurisdictions.', 'required' => true],
                    ['question' => 'How have you handled a major regulatory change impacting your risk framework?', 'required' => true],
                    ['question' => 'What is your current notice period?', 'required' => true],
                ],
                'status'                 => 'active',
                'is_exclusive'           => true,
                'exclusive_recruiter_id' => $r1->id,
                'is_featured'            => true,
                'is_fast_track'          => false,
                'timer_a_days'           => 5,
                'timer_b_active'         => true,
                'timer_b_days'           => 7,
                'timer_b_penalty_d6'     => 0.10,
                'timer_b_penalty_d7'     => 0.20,
                'timer_b_penalty_d8plus' => 0.30,
                'timer_c_active'         => true,
                'timer_c_sla_days'       => 5,
                'assignment_count'       => 1,
                'published_at'           => now()->subDays(4),
                'original_post_date'     => now()->subDays(4),
            ]
        );

        // Mandate 2: Sea Limited — VP Engineering, Shopee SG (active, open)
        $mandate2 = Mandate::firstOrCreate(
            ['title' => 'VP Engineering, Shopee Singapore', 'client_id' => $client2->id],
            [
                'client_id'              => $client2->id,
                'posted_by_user_id'      => $admin->id,
                'compensation_type_id'   => $compPct->id,
                'title'                  => 'VP Engineering, Shopee Singapore',
                'description'            => '<p><strong>About the Role</strong></p><p>Lead Shopee Singapore\'s backend engineering organisation of 200+ engineers. Drive the technical roadmap for one of SEA\'s largest e-commerce platforms. Collaborate with Garena and SeaMoney tech leads on shared infrastructure.</p><p><strong>Requirements</strong></p><ul><li>12+ years engineering experience; 5+ years in an engineering leadership role</li><li>Experience scaling distributed systems to hundreds of millions of transactions</li><li>Strong track record building and leading large engineering teams</li></ul>',
                'location'               => 'Singapore',
                'seniority'              => 'vp_director',
                'industry'               => 'Technology',
                'contract_type'          => 'full_time',
                'openings_count'         => 1,
                'is_remote'              => false,
                'salary_min'             => 360000.00,
                'salary_max'             => 480000.00,
                'salary_currency'        => 'SGD',
                'reward_min'             => 54000.00,
                'reward_max'             => 72000.00,
                'reward_pct'             => 0.15,
                'must_haves'             => ['12+ years engineering', '5+ years engineering leadership', 'Large-scale distributed systems'],
                'nice_to_haves'          => ['E-commerce platform experience', 'Mandarin speaking', 'FAANG or Tier-1 tech background'],
                'green_flags'            => ['Led 100+ engineer org', 'Built marketplace or payments systems', 'Strong OSS contributions'],
                'red_flags'              => ['No people management experience', 'Pure IC background', 'No experience at scale'],
                'screening_questions'    => [
                    ['question' => 'Describe the largest engineering team you have directly managed.', 'required' => true],
                    ['question' => 'What distributed systems challenges have you solved at scale?', 'required' => true],
                ],
                'status'                 => 'active',
                'is_exclusive'           => false,
                'is_featured'            => true,
                'is_fast_track'          => true,
                'timer_a_days'           => 3,
                'timer_b_active'         => true,
                'timer_b_days'           => 5,
                'timer_b_penalty_d6'     => 0.10,
                'timer_b_penalty_d7'     => 0.20,
                'timer_b_penalty_d8plus' => 0.30,
                'timer_c_active'         => false,
                'assignment_count'       => 0,
                'published_at'           => now()->subDays(2),
                'original_post_date'     => now()->subDays(2),
            ]
        );

        // Mandate 3: Unilever — Country Manager Vietnam (active, assigned to Linh)
        $mandate3 = Mandate::firstOrCreate(
            ['title' => 'Country Manager, Vietnam', 'client_id' => $client3->id],
            [
                'client_id'              => $client3->id,
                'posted_by_user_id'      => $admin->id,
                'compensation_type_id'   => $compPct->id,
                'title'                  => 'Country Manager, Vietnam',
                'description'            => '<p><strong>About the Role</strong></p><p>Unilever Vietnam is looking for a commercially driven Country Manager to lead its P&L of ~$800M USD. The CM will manage a team of 1,200 employees across sales, marketing, supply chain, and corporate functions.</p><p><strong>Ideal Background</strong></p><ul><li>FMCG General Manager or Country Manager experience in SEA</li><li>Strong P&L track record ($500M+)</li><li>Deep understanding of Vietnamese consumer market</li></ul>',
                'location'               => 'Ho Chi Minh City, Vietnam',
                'seniority'              => 'c_suite',
                'industry'               => 'FMCG',
                'contract_type'          => 'full_time',
                'openings_count'         => 1,
                'is_remote'              => false,
                'salary_min'             => 250000.00,
                'salary_max'             => 350000.00,
                'salary_currency'        => 'USD',
                'reward_min'             => 37500.00,
                'reward_max'             => 52500.00,
                'reward_pct'             => 0.15,
                'must_haves'             => ['FMCG GM or CM experience', 'SEA leadership', 'P&L ownership $500M+'],
                'nice_to_haves'          => ['Vietnamese language', 'Unilever or P&G background', 'Local Vietnam network'],
                'green_flags'            => ['Led $1B+ P&L', 'Previously in Vietnam market', 'Known in local FMCG circle'],
                'red_flags'              => ['No FMCG background', 'No P&L experience', 'Pure expat with no SEA roots'],
                'screening_questions'    => [
                    ['question' => 'What is the largest P&L you have personally owned and in which market?', 'required' => true],
                    ['question' => 'Do you have fluency in Vietnamese? If not, describe your experience leading local Vietnam teams.', 'required' => false],
                    ['question' => 'What is your current base salary and expected package?', 'required' => true],
                ],
                'status'                 => 'active',
                'is_exclusive'           => false,
                'is_featured'            => false,
                'is_fast_track'          => false,
                'timer_a_days'           => 5,
                'timer_b_active'         => false,
                'timer_c_active'         => false,
                'assignment_count'       => 1,
                'published_at'           => now()->subDays(6),
                'original_post_date'     => now()->subDays(6),
            ]
        );

        // Mandate 4: Sea — Head of Product, SeaMoney (open, not claimed yet)
        $mandate4 = Mandate::firstOrCreate(
            ['title' => 'Head of Product, SeaMoney', 'client_id' => $client2->id],
            [
                'client_id'              => $client2->id,
                'posted_by_user_id'      => $admin->id,
                'compensation_type_id'   => $compFixed->id,
                'title'                  => 'Head of Product, SeaMoney',
                'description'            => '<p><strong>About the Role</strong></p><p>Drive product strategy for SeaMoney\'s digital wallet, lending, and insurance products across 7 SEA markets. Work directly with the CEO of SeaMoney and cross-functional leads to define the 3-year roadmap.</p>',
                'location'               => 'Singapore',
                'seniority'              => 'vp_director',
                'industry'               => 'Fintech',
                'contract_type'          => 'full_time',
                'openings_count'         => 1,
                'is_remote'              => false,
                'salary_min'             => 300000.00,
                'salary_max'             => 400000.00,
                'salary_currency'        => 'SGD',
                'reward_min'             => 45000.00,
                'reward_max'             => 60000.00,
                'reward_pct'             => 0.15,
                'must_haves'             => ['Product leadership in fintech', '8+ years product management', 'SEA market experience'],
                'nice_to_haves'          => ['Payments or lending product experience', 'Multi-market product roles'],
                'green_flags'            => ['VP Product at a major neobank', 'Launched financial product at scale'],
                'red_flags'              => ['No fintech experience', 'Less than 5 years PM experience'],
                'screening_questions'    => [
                    ['question' => 'Describe a financial product you took from 0 to 1 million users.', 'required' => true],
                ],
                'status'                 => 'active',
                'is_exclusive'           => false,
                'is_featured'            => false,
                'is_fast_track'          => false,
                'timer_a_days'           => 3,
                'timer_b_active'         => false,
                'timer_c_active'         => false,
                'assignment_count'       => 0,
                'published_at'           => now()->subDay(),
                'original_post_date'     => now()->subDay(),
            ]
        );

        // ── 4. MANDATE CLAIMS ────────────────────────────────────────────────

        // Claim 1: Priya on Mandate 1 (approved — Day 0 = 4 days ago)
        $claim1 = MandateClaim::firstOrCreate(
            ['mandate_id' => $mandate1->id, 'recruiter_id' => $r1->id],
            [
                'status'           => 'approved',
                'reviewed_by'      => $admin->id,
                'admin_note'       => 'Priya has strong fintech CRO network. Approved.',
                'reviewed_at'      => now()->subDays(4),
                'assigned_at'      => now()->subDays(4),
                'rejection_count'  => 0,
                'is_retry'         => false,
            ]
        );

        // Claim 2: Marcus on Mandate 2 (approved — Day 0 = 2 days ago)
        $claim2 = MandateClaim::firstOrCreate(
            ['mandate_id' => $mandate2->id, 'recruiter_id' => $r2->id],
            [
                'status'           => 'approved',
                'reviewed_by'      => $admin->id,
                'admin_note'       => 'Marcus specialises in tech VP roles. Good fit.',
                'reviewed_at'      => now()->subDays(2),
                'assigned_at'      => now()->subDays(2),
                'rejection_count'  => 0,
                'is_retry'         => false,
            ]
        );

        // Claim 3: Linh on Mandate 3 (approved — Day 0 = 5 days ago)
        $claim3 = MandateClaim::firstOrCreate(
            ['mandate_id' => $mandate3->id, 'recruiter_id' => $r3->id],
            [
                'status'           => 'approved',
                'reviewed_by'      => $admin->id,
                'admin_note'       => 'Linh has excellent FMCG network in Vietnam.',
                'reviewed_at'      => now()->subDays(5),
                'assigned_at'      => now()->subDays(5),
                'rejection_count'  => 0,
                'is_retry'         => false,
            ]
        );

        // Claim 4: Marcus on Mandate 4 (pending admin review)
        $claim4 = MandateClaim::firstOrCreate(
            ['mandate_id' => $mandate4->id, 'recruiter_id' => $r2->id],
            [
                'status'          => 'pending',
                'rejection_count' => 0,
                'is_retry'        => false,
            ]
        );

        // Claim 5: Priya — pending claim on Mandate 4 (she wants it too)
        MandateClaim::firstOrCreate(
            ['mandate_id' => $mandate4->id, 'recruiter_id' => $r1->id],
            [
                'status'          => 'pending',
                'rejection_count' => 0,
                'is_retry'        => false,
            ]
        );

        // ── 5. CANDIDATES ────────────────────────────────────────────────────

        // Candidate 1: For Mandate 1 (CRO at Grab) — via Priya
        $cand1 = Candidate::firstOrCreate(
            ['email' => 'david.chen@example.com', 'recruiter_id' => $r1->id],
            [
                'recruiter_id'    => $r1->id,
                'first_name'      => 'David',
                'last_name'       => 'Chen',
                'email'           => 'david.chen@example.com',
                'phone'           => '+65 9812 3456',
                'linkedin_url'    => 'https://linkedin.com/in/david-chen-risk',
                'current_role'    => 'Chief Risk Officer (SEA)',
                'current_company' => 'DBS Bank',
                'location'        => 'Singapore',
                'years_experience' => 18,
                'current_salary'  => 480000.00,
                'expected_salary' => 520000.00,
                'salary_currency' => 'SGD',
                'nationality'     => 'Singaporean',
                'skills'          => ['Enterprise Risk', 'Credit Risk', 'Regulatory Compliance', 'Team Leadership', 'MAS Engagement', 'Basel III', 'Stress Testing'],
                'notes'           => 'Highly confidential. David is currently CRO at DBS SEA division. Open to move for the right CEO-level exposure. Must not contact via DBS channels.',
                'recruiter_notes' => 'Very strong profile. Matched 9/10 on must-haves. Notice period 3 months.',
                'parsed_profile'  => [
                    'name'             => 'David Chen',
                    'current_role'     => 'Chief Risk Officer (SEA)',
                    'current_company'  => 'DBS Bank',
                    'years_experience' => 18,
                    'seniority_level'  => 'c_suite',
                    'work_history'     => [
                        ['title' => 'Chief Risk Officer SEA', 'company' => 'DBS Bank', 'dates' => '2019–present', 'description' => 'Led enterprise risk for DBS SEA with P&L exposure of $4B. Managed 55-person risk team.'],
                        ['title' => 'Head of Credit Risk', 'company' => 'Standard Chartered', 'dates' => '2014–2019', 'description' => 'Oversaw credit risk models for corporate banking across APAC.'],
                        ['title' => 'Risk Manager', 'company' => 'KPMG', 'dates' => '2006–2014', 'description' => 'Advisory and audit for financial risk frameworks for MAS-regulated entities.'],
                    ],
                    'education'        => [
                        ['degree' => 'MSc Financial Risk Management', 'institution' => 'NUS Business School', 'year' => 2006],
                        ['degree' => 'BEng Electrical Engineering', 'institution' => 'NTU Singapore', 'year' => 2003],
                    ],
                    'skills'           => ['Enterprise Risk', 'Credit Risk', 'MAS Regulations', 'Basel III', 'Team Leadership'],
                    'achievements'     => ['Led MAS GLAA submission for DBS (2022)', 'Built SEA-wide stress testing framework adopted by all local subsidiaries', 'Promoted to CRO position after 2 years as Deputy CRO'],
                ],
                'cv_parsed'       => true,
                'cv_file_path'    => 'candidates/1/david-chen-cv.pdf',
                'cv_file_name'    => 'DavidChen_CV_2026.pdf',
                'cv_uploaded_at'  => now()->subDays(3),
                'cv_parsed_at'    => now()->subDays(3),
            ]
        );

        // Candidate 2: For Mandate 1 (CRO at Grab) — via Priya (second candidate)
        $cand2 = Candidate::firstOrCreate(
            ['email' => 'ananya.krishnan@example.com', 'recruiter_id' => $r1->id],
            [
                'recruiter_id'    => $r1->id,
                'first_name'      => 'Ananya',
                'last_name'       => 'Krishnan',
                'email'           => 'ananya.krishnan@example.com',
                'phone'           => '+65 9234 5678',
                'linkedin_url'    => 'https://linkedin.com/in/ananya-krishnan-sg',
                'current_role'    => 'Global Head of Operational Risk',
                'current_company' => 'Prudential plc',
                'location'        => 'Singapore',
                'years_experience' => 15,
                'current_salary'  => 380000.00,
                'expected_salary' => 450000.00,
                'salary_currency' => 'SGD',
                'nationality'     => 'Indian (PR)',
                'skills'          => ['Operational Risk', 'Regulatory Risk', 'Insurance Risk', 'APAC Leadership', 'Board Presentations'],
                'notes'           => 'Very polished communicator. Was shortlisted for Group CRO at Prudential last year but lost out to internal candidate. Motivated to make the move.',
                'recruiter_notes' => 'Strong but insurance background may be a slight gap for Grab\'s lending focus. Still 8/10.',
                'cv_parsed'       => true,
                'cv_file_path'    => 'candidates/1/ananya-krishnan-cv.pdf',
                'cv_file_name'    => 'Ananya_Krishnan_CV.pdf',
                'cv_uploaded_at'  => now()->subDays(2),
                'cv_parsed_at'    => now()->subDays(2),
            ]
        );

        // Candidate 3: For Mandate 2 (VP Eng at Shopee) — via Marcus
        $cand3 = Candidate::firstOrCreate(
            ['email' => 'kevin.wu@example.com', 'recruiter_id' => $r2->id],
            [
                'recruiter_id'    => $r2->id,
                'first_name'      => 'Kevin',
                'last_name'       => 'Wu',
                'email'           => 'kevin.wu@example.com',
                'phone'           => '+65 8901 2345',
                'linkedin_url'    => 'https://linkedin.com/in/kevinwu-eng',
                'current_role'    => 'Senior Director of Engineering',
                'current_company' => 'Lazada (Alibaba Group)',
                'location'        => 'Singapore',
                'years_experience' => 14,
                'current_salary'  => 390000.00,
                'expected_salary' => 430000.00,
                'salary_currency' => 'SGD',
                'nationality'     => 'Singaporean',
                'skills'          => ['Distributed Systems', 'Microservices', 'Team Leadership', 'E-commerce Infrastructure', 'Golang', 'Kubernetes', 'AWS'],
                'notes'           => 'Currently leads 120 engineers at Lazada. Managed migration of monolith to microservices handling 50M transactions/day. Very interested in VP step-up.',
                'recruiter_notes' => 'Excellent match. Lazada background is almost identical to Shopee scale. 9.5/10.',
                'parsed_profile'  => [
                    'name'             => 'Kevin Wu',
                    'current_role'     => 'Senior Director of Engineering',
                    'current_company'  => 'Lazada (Alibaba Group)',
                    'years_experience' => 14,
                    'seniority_level'  => 'vp_director',
                    'work_history'     => [
                        ['title' => 'Senior Director of Engineering', 'company' => 'Lazada', 'dates' => '2020–present', 'description' => 'Led 120 engineers across platform, fulfilment, and payments. Scaled to 50M txn/day.'],
                        ['title' => 'Director of Engineering', 'company' => 'Grab', 'dates' => '2016–2020', 'description' => 'Built GrabPay engineering team from 8 to 60 engineers.'],
                        ['title' => 'Software Engineer → Tech Lead', 'company' => 'Google Singapore', 'dates' => '2010–2016', 'description' => 'Backend infrastructure for Google Pay.'],
                    ],
                    'education' => [
                        ['degree' => 'BComp Computer Science (Hons)', 'institution' => 'NUS', 'year' => 2010],
                    ],
                    'skills' => ['Distributed Systems', 'Microservices', 'Golang', 'Kubernetes', 'Team Leadership'],
                    'achievements' => ['Migrated Lazada monolith to microservices (3x performance gain)', 'Built 120-person engineering org from 50', 'Led 0-downtime traffic migration during 11.11 peak'],
                ],
                'cv_parsed'       => true,
                'cv_file_path'    => 'candidates/2/kevin-wu-cv.pdf',
                'cv_file_name'    => 'KevinWu_CV_2026.pdf',
                'cv_uploaded_at'  => now()->subDay(),
                'cv_parsed_at'    => now()->subDay(),
            ]
        );

        // Candidate 4: For Mandate 3 (Country Manager Vietnam) — via Linh
        $cand4 = Candidate::firstOrCreate(
            ['email' => 'trang.ho@example.com', 'recruiter_id' => $r3->id],
            [
                'recruiter_id'    => $r3->id,
                'first_name'      => 'Trang',
                'last_name'       => 'Ho',
                'email'           => 'trang.ho@example.com',
                'phone'           => '+84 91 234 5678',
                'linkedin_url'    => 'https://linkedin.com/in/trangho-vn',
                'current_role'    => 'General Manager, Vietnam & Cambodia',
                'current_company' => 'Nestlé Indochina',
                'location'        => 'Ho Chi Minh City, Vietnam',
                'years_experience' => 16,
                'current_salary'  => 220000.00,
                'expected_salary' => 290000.00,
                'salary_currency' => 'USD',
                'nationality'     => 'Vietnamese',
                'skills'          => ['P&L Management', 'FMCG Sales', 'GTM Strategy', 'Distributor Management', 'Government Relations', 'Vietnamese Market Expertise'],
                'notes'           => 'Trang is currently GM for Nestlé Vietnam & Cambodia, managing a $650M P&L. Native Vietnamese, strong government relations. Open to Unilever move for larger scope.',
                'recruiter_notes' => 'Near-perfect fit. Only gap is Unilever preference for MNC-to-MNC moves vs. regional brand.',
                'cv_parsed'       => true,
                'cv_file_path'    => 'candidates/3/trang-ho-cv.pdf',
                'cv_file_name'    => 'TrangHo_CV_2026.pdf',
                'cv_uploaded_at'  => now()->subDays(4),
                'cv_parsed_at'    => now()->subDays(4),
            ]
        );

        // Candidate 5: A second candidate for Mandate 3 — hired already (for placement demo)
        $cand5 = Candidate::firstOrCreate(
            ['email' => 'michael.tang@example.com', 'recruiter_id' => $r1->id],
            [
                'recruiter_id'    => $r1->id,
                'first_name'      => 'Michael',
                'last_name'       => 'Tang',
                'email'           => 'michael.tang@example.com',
                'phone'           => '+65 9456 7890',
                'linkedin_url'    => 'https://linkedin.com/in/michaeltang-sea',
                'current_role'    => 'Country Manager, Singapore & Malaysia',
                'current_company' => 'L\'Oréal SEA',
                'location'        => 'Singapore',
                'years_experience' => 20,
                'current_salary'  => 380000.00,
                'expected_salary' => 420000.00,
                'salary_currency' => 'SGD',
                'nationality'     => 'Singaporean',
                'skills'          => ['P&L Management', 'FMCG', 'Consumer Insights', 'Board Reporting', 'Regional Leadership'],
                'notes'           => 'Placed by Priya in a previous mandate. Comprehensive candidate for reference.',
                'recruiter_notes' => 'Past successful placement. Good reference profile.',
                'cv_parsed'       => true,
                'cv_file_path'    => 'candidates/1/michael-tang-cv.pdf',
                'cv_file_name'    => 'MichaelTang_CV.pdf',
                'cv_uploaded_at'  => now()->subDays(60),
                'cv_parsed_at'    => now()->subDays(60),
            ]
        );

        // ── 6. CDD SUBMISSIONS ───────────────────────────────────────────────

        // Submission 1: David Chen → Mandate 1 (Grab CRO) — admin-approved, shortlisted by client
        $sub1 = CddSubmission::firstOrCreate(
            ['mandate_id' => $mandate1->id, 'candidate_id' => $cand1->id],
            [
                'mandate_id'          => $mandate1->id,
                'recruiter_id'        => $r1->id,
                'candidate_id'        => $cand1->id,
                'submitted_at'        => now()->subDays(3),
                'recruiter_note'      => 'David is an exceptional CRO candidate with direct comparables to the Grab role. He has 18 years of financial risk experience across DBS and Standard Chartered, with strong MAS regulatory exposure. He is actively managing a 55-person team and is keen on the CEO-reporting line at Grab. Available in 3 months.',
                'submission_number'   => 1,
                'ai_score'            => 92,
                'score_breakdown'     => ['experience' => 95, 'industry' => 90, 'scope' => 92, 'leadership' => 93, 'digital' => 88],
                'ai_summary'          => 'David Chen is a highly qualified CRO with 18 years of enterprise risk experience across DBS Bank and Standard Chartered. He currently leads a 55-person risk team covering SEA markets, with direct regulatory interface with MAS and OJK. His background aligns closely with Grab Financial\'s cross-market risk requirements. He has a proven track record of building and implementing stress-testing frameworks and has successfully navigated multiple regulatory examinations.',
                'green_flags'         => ['Current DBS CRO > direct comparable', '18 years experience > threshold', 'Active MAS engagement history'],
                'red_flags'           => ['3-month notice period', 'Banking vs. pure fintech background (minor gap)'],
                'admin_review_status' => 'approved',
                'admin_reviewed_by'   => $admin->id,
                'admin_reviewed_at'   => now()->subDays(2),
                'admin_note'          => 'Strong profile. CRO background is directly comparable. Approved for client review.',
                'admin_rejection_count' => 0,
                'exception_bypass'    => false,
                'client_status'       => 'shortlisted',
                'client_status_updated_at' => now()->subDay(),
                'token'               => Str::random(64),
                'token_created_at'    => now()->subDays(2),
                'gsheet_row_index'    => 2,
            ]
        );

        // Submission 2: Ananya Krishnan → Mandate 1 (Grab CRO) — pending admin review
        $sub2 = CddSubmission::firstOrCreate(
            ['mandate_id' => $mandate1->id, 'candidate_id' => $cand2->id],
            [
                'mandate_id'          => $mandate1->id,
                'recruiter_id'        => $r1->id,
                'candidate_id'        => $cand2->id,
                'submitted_at'        => now()->subDays(1),
                'recruiter_note'      => 'Ananya brings strong operational risk expertise from Prudential. While her background is insurance vs. lending, her regulatory exposure and leadership profile are excellent. She was shortlisted internally for Group CRO last year, demonstrating senior-level readiness.',
                'submission_number'   => 2,
                'ai_score'            => 79,
                'score_breakdown'     => ['experience' => 82, 'industry' => 70, 'scope' => 83, 'leadership' => 88, 'digital' => 71],
                'ai_summary'          => 'Ananya Krishnan is a seasoned risk leader with 15 years at Prudential plc across APAC. She heads global operational risk and has strong regulatory relationships with MAS. While her primary background is insurance risk rather than lending/credit, her executive presence, board-level communication skills, and operational risk depth make her a compelling candidate for this role.',
                'green_flags'         => ['Global Head title', 'Board-level presenter', 'MAS relationship', 'Was Group CRO shortlist candidate'],
                'red_flags'           => ['Insurance-first, not lending/credit', 'Gap in credit risk depth'],
                'admin_review_status' => 'pending',
                'admin_rejection_count' => 0,
                'exception_bypass'    => false,
                'client_status'       => 'pending',
                'token'               => Str::random(64),
                'token_created_at'    => now()->subDay(),
            ]
        );

        // Submission 3: Kevin Wu → Mandate 2 (Shopee VP Eng) — bypassed (fast-track), interview scheduled
        $sub3 = CddSubmission::firstOrCreate(
            ['mandate_id' => $mandate2->id, 'candidate_id' => $cand3->id],
            [
                'mandate_id'          => $mandate2->id,
                'recruiter_id'        => $r2->id,
                'candidate_id'        => $cand3->id,
                'submitted_at'        => now()->subDay(),
                'recruiter_note'      => 'Kevin is the strongest VP Engineering candidate in the SEA market right now. His Lazada experience is a near-perfect parallel to Shopee\'s scale. He led 120 engineers through the peak 11.11 traffic season and has a direct Grab background. He is actively looking for a VP step-up and can start within 6 weeks.',
                'submission_number'   => 1,
                'ai_score'            => 96,
                'score_breakdown'     => ['experience' => 97, 'industry' => 95, 'scope' => 96, 'leadership' => 95, 'digital' => 98],
                'ai_summary'          => 'Kevin Wu is an outstanding engineering leader with 14 years of experience building large-scale distributed systems. Currently leading 120 engineers at Lazada (Alibaba Group), he has directly comparable experience to Shopee\'s scale and technical requirements. His previous role at Grab Pay adds further relevance to the Sea ecosystem. He is technically credible at CTO-minus level and is a proven people leader.',
                'green_flags'         => ['120-person team at direct competitor', 'Previous Grab experience', '50M txn/day scale', 'Google background'],
                'red_flags'           => ['6-week notice may delay start'],
                'admin_review_status' => 'bypassed',
                'admin_reviewed_by'   => $admin->id,
                'admin_reviewed_at'   => now()->subDay(),
                'admin_note'          => 'Bypassed — mandate is_fast_track = true.',
                'admin_rejection_count' => 0,
                'exception_bypass'    => true,
                'client_status'       => 'interview',
                'client_status_updated_at' => now()->subHours(12),
                'interview_date'      => now()->addDays(3),
                'interview_format'    => 'Panel — CTO + CEO + Head of People',
                'interview_notes'     => 'First round panel interview. Engineering problem + leadership case study. 3 hours.',
                'token'               => Str::random(64),
                'token_created_at'    => now()->subDay(),
                'token_used_at'       => now()->subHours(10),
                'gsheet_row_index'    => 2,
            ]
        );

        // Submission 4: Trang Ho → Mandate 3 (Unilever CM Vietnam) — approved, offer made
        $sub4 = CddSubmission::firstOrCreate(
            ['mandate_id' => $mandate3->id, 'candidate_id' => $cand4->id],
            [
                'mandate_id'          => $mandate3->id,
                'recruiter_id'        => $r3->id,
                'candidate_id'        => $cand4->id,
                'submitted_at'        => now()->subDays(4),
                'recruiter_note'      => 'Trang is the strongest FMCG CM profile in Vietnam right now. Her $650M P&L at Nestlé is a direct match for Unilever Vietnam\'s $800M scope. She is native Vietnamese, has deep government and trade relationships, and is highly regarded in the HCMC business community.',
                'submission_number'   => 1,
                'ai_score'            => 91,
                'score_breakdown'     => ['experience' => 93, 'industry' => 95, 'scope' => 90, 'leadership' => 94, 'digital' => 82],
                'ai_summary'          => 'Trang Ho is an ideal candidate for the Country Manager Vietnam role. She currently leads Nestlé\'s Vietnam and Cambodia operation with a $650M P&L and 900 employees — directly comparable to the Unilever Vietnam scope. As a native Vietnamese speaker with 16 years in FMCG and deep government relations, she brings rare local market depth combined with MNC governance standards.',
                'green_flags'         => ['$650M P&L direct comparable', 'Native Vietnamese', 'Nestlé brand > MNC credibility', 'Government relations depth'],
                'red_flags'           => ['Nestlé vs. Unilever category differences (minor)', 'Currently happy — needs compelling package'],
                'admin_review_status' => 'approved',
                'admin_reviewed_by'   => $admin->id,
                'admin_reviewed_at'   => now()->subDays(3),
                'admin_note'          => 'Outstanding candidate. Approve immediately.',
                'admin_rejection_count' => 0,
                'exception_bypass'    => false,
                'client_status'       => 'offer_made',
                'client_status_updated_at' => now()->subDay(),
                'interview_date'      => now()->subDays(2),
                'interview_format'    => 'Executive panel — Regional President + Global HR',
                'interview_notes'     => 'Two rounds completed. Strongly recommended by panel.',
                'interview_feedback'  => 'Excellent across all dimensions. Strong commercial acumen, credible strategic thinking, and impressive local knowledge. Panel voted unanimously to proceed to offer.',
                'interview_feedback_stars' => 5,
                'interview_verdict'   => 'strong_yes',
                'client_feedback'     => 'We are very impressed with Trang. She demonstrated deep market knowledge and a clear vision for the Vietnam business. We are proceeding to offer stage.',
                'client_feedback_sentiment' => 'positive',
                'token'               => Str::random(64),
                'token_created_at'    => now()->subDays(3),
                'token_used_at'       => now()->subDays(2),
                'gsheet_row_index'    => 2,
            ]
        );

        // Submission 5: Michael Tang — completed placement (historical, hired)
        // Use a historical mandate for context — re-use mandate3 but mark as filled scenario
        // Actually create a separate completed submission using mandates that are now filled
        // Let's attach to mandate1 as a historical context candidate (different submission)
        // We'll just create a hired submission for Mandate 3 using cand5 for the placement demo
        // First, we need another mandate that's "filled" — let's create one
        $mandateFilled = Mandate::firstOrCreate(
            ['title' => 'Head of Finance, Grab Pay', 'client_id' => $client1->id],
            [
                'client_id'              => $client1->id,
                'posted_by_user_id'      => $admin->id,
                'compensation_type_id'   => $compPct->id,
                'title'                  => 'Head of Finance, Grab Pay',
                'description'            => '<p>Lead financial planning & analysis for Grab Pay across SEA. Manage a 20-person finance team.</p>',
                'location'               => 'Singapore',
                'seniority'              => 'vp_director',
                'industry'               => 'Fintech',
                'contract_type'          => 'full_time',
                'openings_count'         => 1,
                'is_remote'              => false,
                'salary_min'             => 200000.00,
                'salary_max'             => 280000.00,
                'salary_currency'        => 'SGD',
                'reward_min'             => 30000.00,
                'reward_max'             => 42000.00,
                'reward_pct'             => 0.15,
                'must_haves'             => ['Finance leadership in fintech', 'SEA exposure'],
                'nice_to_haves'          => ['CPA/CA qualified', 'Payment industry background'],
                'green_flags'            => ['VP Finance at fintech', 'Managed large team'],
                'red_flags'              => ['No fintech experience'],
                'screening_questions'    => [],
                'status'                 => 'filled',
                'is_exclusive'           => false,
                'is_featured'            => false,
                'is_fast_track'          => false,
                'timer_a_days'           => 3,
                'timer_b_active'         => false,
                'timer_c_active'         => false,
                'assignment_count'       => 1,
                'published_at'           => now()->subDays(75),
                'original_post_date'     => now()->subDays(75),
            ]
        );

        $claimFilled = MandateClaim::firstOrCreate(
            ['mandate_id' => $mandateFilled->id, 'recruiter_id' => $r1->id],
            [
                'status'      => 'approved',
                'reviewed_by' => $admin->id,
                'reviewed_at' => now()->subDays(74),
                'assigned_at' => now()->subDays(74),
            ]
        );

        $subHired = CddSubmission::firstOrCreate(
            ['mandate_id' => $mandateFilled->id, 'candidate_id' => $cand5->id],
            [
                'mandate_id'               => $mandateFilled->id,
                'recruiter_id'             => $r1->id,
                'candidate_id'             => $cand5->id,
                'submitted_at'             => now()->subDays(68),
                'recruiter_note'           => 'Michael is an outstanding finance leader with direct fintech comparables.',
                'submission_number'        => 1,
                'ai_score'                 => 88,
                'score_breakdown'          => ['experience' => 90, 'industry' => 85, 'scope' => 88, 'leadership' => 90, 'digital' => 86],
                'ai_summary'               => 'Michael Tang is a highly experienced FMCG finance leader transitioning to fintech. His P&L experience and team leadership are excellent matches.',
                'green_flags'              => ['Strong P&L background', 'Regional scope', 'Excellent commercial acumen'],
                'red_flags'               => [],
                'admin_review_status'      => 'approved',
                'admin_reviewed_by'        => $admin->id,
                'admin_reviewed_at'        => now()->subDays(67),
                'exception_bypass'         => false,
                'client_status'            => 'hired',
                'client_status_updated_at' => now()->subDays(45),
                'interview_date'           => now()->subDays(60),
                'interview_format'         => 'Two rounds with CFO and CEO',
                'interview_feedback'       => 'Excellent commercial instincts. Hire.',
                'interview_feedback_stars' => 5,
                'interview_verdict'        => 'strong_yes',
                'client_feedback'          => 'Michael performed exceptionally well across both rounds. Very impressed with his strategic thinking and cultural fit. We are delighted to make an offer.',
                'client_feedback_sentiment' => 'positive',
                'token'                    => Str::random(64),
                'token_created_at'         => now()->subDays(67),
                'token_used_at'            => now()->subDays(60),
                'penalty_applied'          => 0,
                'days_late'                => 0,
            ]
        );

        // ── 7. PLACEMENT ─────────────────────────────────────────────────────

        Placement::firstOrCreate(
            ['cdd_submission_id' => $subHired->id],
            [
                'mandate_id'          => $mandateFilled->id,
                'recruiter_id'        => $r1->id,
                'client_id'           => $client1->id,
                'gross_reward'        => 36000.00,
                'platform_fee'        => 7200.00,
                'net_payout'          => 28800.00,
                'penalty_amount'      => 0.00,
                'final_payout'        => 28800.00,
                'currency'            => 'SGD',
                'payout_status'       => 'paid',
                'payout_date'         => now()->subDays(30),
                'candidate_start_date' => now()->subDays(35)->toDateString(),
                'placed_at'           => now()->subDays(45),
            ]
        );

        // Update Priya's total_earnings to reflect placement
        $r1->update([
            'total_placements' => $r1->total_placements,
            'total_earnings'   => $r1->total_earnings,
        ]);

        $this->command->info('✓ 3 recruiters created (Priya / Marcus / Linh)');
        $this->command->info('✓ 3 clients created (Grab Financial / Sea Limited / Unilever SEA)');
        $this->command->info('✓ 5 mandates created (4 active + 1 filled)');
        $this->command->info('✓ 5 mandate claims created');
        $this->command->info('✓ 5 candidates created');
        $this->command->info('✓ 5 CDD submissions created (various statuses)');
        $this->command->info('✓ 1 placement created (paid)');
    }
}
