<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Input;
use App\User;
use App\Tasks;
use App\TaskHours;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

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

    public function addTaskHours($taskId, $userId, $duration, $title){


        if(is_int($userId) && is_int($taskId) && is_int($duration) && $title !== "" && $title !== null){

            $hours = new TaskHours;
            $hours->ownerId = $userId;
            $hours->taskId = $taskId;
            $hours->duration = $duration;
            $hours->save();

            return json_encode(array('result'=>'success', 'taskId'=>$taskId));
        }
        else{
            return json_encode(array('result'=>'error3'));
        }
    }

    public function deleteHours(){

        $taskId = (int)Input::get('taskId');
        $userId = (int)Input::get('userId');

         $hours = DB::table('task_hours')
            ->where('ownerId', $userId)
            ->where('taskId', $taskId)
            ->update(['status' => 'deleted']);
        
        return json_encode(array('result'=>'success'));
    }

    public function deleteTask(){

        $taskId = (int)Input::get('taskId');
        $userId = (int)Input::get('userId');

         $tasks = DB::table('tasks')
            ->where('ownerId', $userId)
            ->where('id', $taskId)
            ->update(['status' => 'deleted']);

        return json_encode(array('result'=>'success'));
    }

    public function getTaskHoursForUser($userId){

        $ids = DB::table('task_hours')
            ->select('taskId')
            ->where('ownerId', $userId)
            ->where('status', 'active')
            ->distinct()
            ->get();

        $tasks = array();

            foreach($ids as $task){

                $hours = DB::table('task_hours')
                    ->where('taskId', $task->taskId)
                    ->where('status', 'active')
                    ->sum('duration');

                $title = Tasks::select('title')
                    ->where('ownerId', $userId)
                    ->where('id', $task->taskId)
                    ->first();

                array_push($tasks, array('taskId' => $task->taskId, 'title' => $title["title"], 'duration' => $hours));

            }

        return $tasks;
    }

    public function getTasksForUser($userId){

        return Tasks::where('ownerId', $userId)
          ->where('status', 'active')
          ->orderBy('id', 'asc')
          ->get();
    }

    public function updateTask($addHours = false){


        //Retreive posted information

        $taskId = (int)Input::get('taskId');
        $userId = (int)Input::get('userId');
        $duration = (int)Input::get('duration');
        $title = Input::get('name');
        $state = Input::get('status');
        $updateHours = false;

        if(Input::get('hours') !== null){
            $updateHours = Input::get('hours');
        }

        //VEEEERY basic input checking
        if(is_int($userId) && is_int($taskId) && is_int($duration) && $title !== "" && $title !== null){

            $task = Tasks::where('ownerId', $userId)
            ->where('id', $taskId)
            ->first();

            //If this task exists all ready, update the information
            if($task !== null && $task->id > 0 && $task->ownerId > 0 && $task->duration >= 0){

                $task->title = $title;
                $task->state = $state;
                $task->duration = $duration;
                $task->state = $state;

                if($addHours){
                    $task->duration = 0;
                }

                $task->save();

                if($addHours){
                    $result = self::addTaskHours($taskId, $userId, $duration, $title);
                    return $result;
                }
                else if($updateHours){
                    return json_encode(array('result'=>'success', 'update' => 'hours'));
                }
                else{
                    return json_encode(array('result'=>'success'));
                }
            }
            //If this task is new, save a new task
            else if($task === null){
                
                $newTask = new Tasks;
                $newTask->ownerId = $userId;
                $newTask->id = $taskId;
                $newTask->title = $title;
                $newTask->state = $state;

                if($addHours){
                    $task->duration = 0;
                }

                $newTask->save();

                if($addHours == true){
                   $result = self::addTaskHours($taskId, $userId, $duration, $title);
                   return $result;
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

    public function updateTaskAndAddHours(){

        $result = self::updateTask(true);

        return $result;
        
    }
}
