<?php

use Illuminate\Database\Seeder;

class TasksTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        DB::table('tasks')->insert([
            'id' => '1',
            'title' => 'Test Project 1',
            'duration' => 100,
            'state' => 'paused',
            'ownerId' => 1,
        ]);

        DB::table('tasks')->insert([
            'id' => '2',
            'title' => 'Test Project 2',
            'duration' => 1200,
            'state' => 'paused',
            'ownerId' => 1,
        ]);

        DB::table('tasks')->insert([
            'id' => '3',
            'title' => 'Test Project 3',
            'duration' => 3242,
            'state' => 'paused',
            'ownerId' => 1,
        ]);

    }
}
