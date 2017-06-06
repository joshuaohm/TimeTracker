<?php

use App\User;
use Illuminate\Support\Facades\Auth;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return redirect('/app');
});

Auth::routes();

Route::get('/app', function (){

  if(Auth::user()){
    $id = Auth::user()->id;
    return view('app', ['userId' => $id]);
  }
  else{
    return view('app', ['userId' => -1]);
  }
  
  
});
Auth::routes();

Route::get('/home', 'HomeController@index')->name('home');
