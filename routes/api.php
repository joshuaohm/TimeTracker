<?php

use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::middleware('auth:api')->get('/user', function (Request $request) {
    return $request->user();
});

Route::get('/tasks/{userId}', 'TimerApiController@getTasksForUser');
Route::get('/hours/{userId}', 'TimerApiController@getTaskHoursForUser');

Route::post('/task', 'TimerApiController@updateTask');
Route::post('/task-hours', 'TimerApiController@updateTaskAndAddHours');
Route::post('/task/delete', 'TimerApiController@deleteTask');
Route::post('/hours/delete', 'TimerApiController@deleteHours');