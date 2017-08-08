<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateTaskHoursTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('task_hours', function (Blueprint $table) {
            $table->increments('id');
            $table->timestamps();
            $table->integer('taskId')->default(0);
            $table->integer('duration')->default(0);
            $table->integer('ownerId')->default(0);
            $table->string('status')->default('active');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('task_hours');
    }
}
