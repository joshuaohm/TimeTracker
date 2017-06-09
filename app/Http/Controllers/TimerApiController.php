<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Input;
use App\User;
use App\Tasks;
use App\TaskHours;
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

    public function addTaskHours(){

        $taskId = (int)Input::get('taskId');
        $userId = (int)Input::get('userId');
        $duration = (int)Input::get('duration');
        $title = Input::get('name');

        if(is_int($userId) && is_int($taskId) && is_int($duration) && $title !== "" && $title !== null){

            $hours = new TaskHours;
            $hours->ownerId = $userId;
            $hours->taskId = $taskId;
            $hours->duration = $duration;
            $hours->save();

            return json_encode(array('result'=>'success'));
        }
        else{
            return json_encode(array('result'=>'error3'));
        }
    }

    public function getTaskHoursForUser($userId){

        return TaskHours::where('ownerId', $userId)
          ->orderBy('id', 'asc')
          ->get();
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
        $submitted = false;

        if(Input::get('submitted') !== null){
            $submitted = Input::get('submitted');
        }

        //VEEEERY basic input checking
        if(is_int($userId) && is_int($taskId) && is_int($duration) && $title !== "" && $title !== null){

            $task = Tasks::where('ownerId', $userId)
            ->where('id', $taskId)
            ->first();

            //This task exists all ready, update the information
            if($task !== null && $task->id > 0 && $task->ownerId > 0 && $task->duration >= 0){

                $task->title = $title;
                $task->state = $state;
                $task->duration = $duration;

                $task->save();

                if($submitted){
                    return json_encode(array('result'=>'success', 'submitted'=>'true', 'id' => $taskId));
                }
                else{
                    return json_encode(array('result'=>'success'));
                }
            }
            //This task is new, save a new task
            else if($task === null){
                
                $newTask = new Tasks;
                $newTask->ownerId = $userId;
                $newTask->id = $taskId;
                $newTask->title = $title;
                $newTask->state = $state;

                $newTask->save();

                if($submitted){
                    return json_encode(array('result'=>'success', 'submitted'=>'true', 'id' => $taskId));
                }
                else{
                    return json_encode(array('result'=>'success'));
                }
                
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
            $task->status = "deleted";
            $task->save();
            return json_encode(array('result'=>'success'));
        }
        else{
            return json_encode(array('result'=>'error1'));
        }


    }
}
