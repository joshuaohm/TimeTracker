<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Input;
use App\User;
use App\Tasks;
use App\Http\Controllers\Controller;

class TimerApiController extends Controller
{
    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        //$this->middleware('auth:api');
    }

    public function getTasksForUser($userId){

        return Tasks::where('ownerId', $userId)
          ->orderBy('id', 'asc')
          ->get();
    }

    public function updateTask(){

        $taskId = (int)Input::get('taskId');
        $userId = (int)Input::get('userId');
        $duration = (int)Input::get('duration');
        $title = Input::get('name');
        $state = Input::get('status');

        if(is_int($userId) && is_int($taskId) && is_int($duration)){

            $task = Tasks::where('ownerId', $userId)
            ->where('id', $taskId)
            ->first();

            if($task !== null && $task->id > 0 && $task->ownerId > 0 && $task->duration >= 0){

                $task->title = $title;
                $task->state = $state;
                $task->duration = $duration;

                $task->save();

                return json_encode(array('result'=>'success'));
            }
            else if($task === null){
                
                $newTask = new Tasks;
                $newTask->ownerId = $userId;
                $newTask->id = $taskId;
                $newTask->title = $title;
                $newTask->state = $state;

                $newTask->save();

                return json_encode(array('result'=>'success'));
            }
            else{
                return json_encode(array('result'=>'error1'));
            }
        }
        else{
            return json_encode(array('result'=>'error2'));
        }
    }

    public function deleteTask(){

        $taskId = (int)Input::get('taskId');
        $userId = (int)Input::get('userId');

        $task = Tasks::where('ownerId', $userId)
            ->where('id', $taskId)
            ->first();

        if($task !==null && $task->id > 0){
            $task->delete();
            return json_encode(array('result'=>'success'));
        }
        else{
            return json_encode(array('result'=>'error1'));
        }


    }
}
