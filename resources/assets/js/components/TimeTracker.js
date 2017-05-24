import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import Modal from './Modal';
import Confirm from './Confirm';

class TimeTracker extends Component {

    constructor(props) {
        super(props);

        this.state = {
            tasks: []
        };
    }

    componentDidMount(){

        //when the application initializes
        //Grab the user's tasks from the database, use this to set the state

        if(userId !== null){
            fetch('/api/tasks/'+userId)
                .then(response => {
                    return response.json();
                })
                .then(tasks => {

                    tasks = this.assignColors(tasks);
                    tasks = this.parseTimes(tasks);
                
                    
                    this.setState({tasks});
            });
        }
    }

    assignColors(tasks){

        //Set a color pattern based on the task's position in the list

        var ci = 1;

        for(var i = 0; i < tasks.length; i++){

            tasks[i].color = ci;

            if(ci === 7){
                ci = 1;
            }
            else{
                ci++;
            }
        }

        return tasks;
    }

    checkForActiveTasks(){

        //Check to see if a task's state is set to play

        for(var i = 0; i < this.state.tasks.length; i++){
            if(this.state.tasks[i].state === 'play'){
                return true;
            }
        }

        return false;
    }

    deleteTask(taskId){

        var tasks = this.state.tasks;

        tasks.splice(this.getTaskIndex(tasks, taskId), 1);
        tasks = this.assignColors(tasks);
        this.setState({tasks});

        console.log(this.getTaskIndex(tasks, taskId));
    }

    getTaskIndex(tasks, taskId){

        //Returns task's index in the task list

        for(var i = 0; i < tasks.length; i++){
            if(tasks[i].id === taskId){
                return i;
            }
        }

        return -1;
    }

    getActiveTask(){

        //return the index of the task currently playing

        for(var i = 0; i < this.state.tasks.length; i++){
            if(this.state.tasks[i].state === 'play'){
                return i;
            }
        }

        return false;
    }

    handleAddTaskButton(e){

        //Event when add task button is clicked

        e.preventDefault();

        if(this.state.tasks.length === 0){
            var taskId = 1;
        }
        else{
            var taskId = this.state.tasks[this.state.tasks.length-1].id+1;
        }
        
        var title = "New Task";
        var duration = 0;

        var newTask = {
            'ownerId': userId,
            'id': taskId,
            'title': title,
            'state': 'paused',
            'duration': 0
        }
        var tasks = this.state.tasks;



        tasks.push(newTask);
        tasks = this.assignColors(tasks);
        tasks = this.parseTimes(tasks);
        this.setState({tasks});
    }

    handleDeleteButton(taskId){

        //Event when delete task button is clicked

        var self = this;

        //open a new confirmation dialogue
        var confirm = function(message, options) {
          var cleanup, component, props, wrapper;
          if (options == null) {
            options = {};
          }
          props = $.extend({
            message: message
          }, options);
          wrapper = document.body.appendChild(document.createElement('div'));
          component = ReactDOM.render(<Confirm {...props}/>, wrapper);
          cleanup = function() {
            ReactDOM.unmountComponentAtNode(wrapper);
            return setTimeout(function() {
              return wrapper.remove();
            });
          };
          return component.promise.always(cleanup).promise();
        };

        return confirm('Are you sure', {
            description: 'Would you like to delete this task?',
            confirmLabel: 'Yes',
            abortLabel: 'No'
        }).then((function(_this) {
            return function() {
                self.deleteTask(taskId);
            };
        })(this));

    }

    handleTimerButton(taskId){

        //Event when play button is clicked on a task

        var newTasks = this.state.tasks;
        var clickTime = new Date().getTime();

        //convert to 0-index
        taskId--;

        this.updateTasks("clicked", taskId, clickTime, newTasks);
    }

    handleTitleChange(taskId){

        //Event when an task's title is edited

        var newTasks = this.state.tasks;

        var newTitle = $('#title-'+taskId)[0].value;


        newTasks[taskId-1].title = newTitle;

        this.setState({newTasks});        

    }

    handleSubmitButton(taskId){

        //Event when the upload button is clicked on an event

        var self = this;

        //convert to 0-index
        taskId--;

        //open a new confirmation dialogue
        var confirm = function(message, options) {
          var cleanup, component, props, wrapper;
          if (options == null) {
            options = {};
          }
          props = $.extend({
            message: message
          }, options);
          wrapper = document.body.appendChild(document.createElement('div'));
          component = ReactDOM.render(<Confirm {...props}/>, wrapper);
          cleanup = function() {
            ReactDOM.unmountComponentAtNode(wrapper);
            return setTimeout(function() {
              return wrapper.remove();
            });
          };
          return component.promise.always(cleanup).promise();
        };

        return confirm('Are you sure', {
            description: 'Would you like to submit these hours?',
            confirmLabel: 'Yes',
            abortLabel: 'No'
        }).then((function(_this) {
            return function() {
                self.submitTask(taskId);
            };
        })(this));
    }

    

    parseTimes(tasks){

        //Convert a task's duration (seconds) into hours and minutes and adds this to the task in state

        for(var i = 0; i < tasks.length; i++){

            tasks[i].hour = Math.floor(tasks[i].duration / 3600);
            tasks[i].minute = Math.floor((tasks[i].duration % 3600) / 60);
        
            if(tasks[i].hour < 10){
                tasks[i].hour = "0"+tasks[i].hour;
            }

            if(tasks[i].minute < 10){
                tasks[i].minute = "0"+tasks[i].minute;
            }
        }

        return tasks;
    }

    pauseAllTasks(taskList){

        //Pauses all tasks

        for(var i = 0; i < taskList.length; i++){
            taskList[i].state = 'paused';
        }

        return taskList;
    }

    postTaskUpdate(userId, taskId, title, state, duration){

        //Post a task's information for updating in the DB

        $.ajax({
            method: "POST",
            url: "/api/task",
            data: {
                "userId":userId,
                "taskId": taskId+1,
                "name": title,
                "status": 'paused',
                "duration": duration
            },
            success: self.submitSucceeded,
            dataType: "json"
        });
    }

    render() {

        //Main render call of entire application

        return (
            <div className="tasks-list" id="main-window">
                <div className="add-task" onClick={(event) => {this.handleAddTaskButton(event)}}>+</div>
                { this.renderTasks() }
            </div>
        );
    }
    

    renderTasks() {

        //Renders each task in the list

        if(this.state.tasks.length === 0 || this.state.tasks == null){
            return (<div></div>);
        }
        else{

            return this.state.tasks.map(task => {
                return (
                    <div className={ "task color-"+task.color } key={ task.id } data-task={ task.id }>
                        <div className="title" data-task={ task.id }>
                            <input type="text" id={"title-"+task.id }  
                                onChange={()=>{this.handleTitleChange(task.id);}} 
                                defaultValue={task.title} />
                        </div>
                        <div className="time">
                            <div className="time-wrapper">
                            <div className="hour" data-task={ task.id }><span>{ task.hour }</span></div>
                                <div className="colon"> 
                                    <span className={"animation-colon "+task.state}>:</span>
                                </div>
                                <div className="minute" data-task={ task.id }><span>{ task.minute }</span></div>
                            </div>
                        </div>
                        <div className="buttonHolder">
                            <div className="upload-btn icon-upload-cloud" data-task={task.id} onClick={(event) => {this.handleSubmitButton(task.id)}}></div>
                            <div className="timer-btn" data-state={ task.state } data-task={ task.id } onClick={(event) => {this.handleTimerButton(task.id)}}>{this.renderTimerButton(task.state)}</div>
                            <div className="delete-btn icon-trash" data-task={task.id} onClick={(event) => {this.handleDeleteButton(task.id)}}></div>
                        </div>
                    </div>
                );
            });
        }
    }

    renderTimerButton(state){

        //Determines if a task's button should display as pause or play and renders it

        if(state === "play"){
            return(
                <div className="icon-pause"></div>
            );        
        }
        else if(state === "paused"){
            return (
                <div className="icon-play"></div>
            );
        }
    }

    setTaskStates(taskId, tasks){

        if(tasks.length > 0){
            if(tasks[taskId].state === 'play'){
                tasks[taskId].state = 'paused';
            }
            else if(tasks[taskId].state === 'paused'){
                tasks = this.pauseAllTasks(tasks);
                tasks[taskId].state = 'play';
            }
        }

        return tasks;
    }

    setTaskTimes(taskId, currTime, tasks){

        //Case 1, task was playing all ready, still playing
        if(tasks[taskId].state === 'play' && Number.isInteger(tasks[taskId].startTime)){

            //Smooth Sailing -- if there's an error at this part, do nothing.
            if(tasks[taskId].startTime && !Number.isInteger(tasks[taskId].stopTime)){
                tasks[taskId].stopTime = currTime;
                tasks = this.updateTimerDuration(true, taskId, tasks);
            }
        }
        //Case 2, task was just started
        else if(tasks[taskId].state === 'play' && !Number.isInteger(tasks[taskId].startTime) && !Number.isInteger(tasks[taskId].stopTime)){
            tasks[taskId].startTime = currTime;
        }
        //Case 3, task was just paused
        else if(tasks[taskId].state === 'paused' && Number.isInteger(tasks[taskId].startTime) && !Number.isInteger(tasks[taskId].stopTime)){
            tasks[taskId].stopTime = currTime;
            tasks = this.updateTimerDuration(false, taskId, tasks);
        }

        return tasks;
    }

    startTimerInterval(taskId){

        if(taskId === this.getActiveTask()){

            var self = this;
            var newTasks = self.state.tasks;
            var currTime = new Date().getTime();

            //The amount of time (in seconds) remaining until the timer should update visually
            var updateTime = 60 - (newTasks[taskId].duration % 60);

            setTimeout(function(){
                self.updateTasks("interval", taskId, currTime+(updateTime*1000), newTasks);
                self.startTimerInterval(taskId);
            },updateTime*1000);
        }
    }

    submitSucceeded(data){

        //TO-DO: Implement error messaging here
        //data should be JSON object { result: "success"};

        console.log("from server");
        console.log(data);

    }

    submitTask(taskId){

        var self = this;
        var curr = new Date().getTime();
        var tasks = self.state.tasks;

        if(tasks[taskId].state === "play"){
            self.updateTasks("submitted-playing", taskId, curr, tasks);
        }
        else{
            self.updateTasks("submitted-paused", taskId, curr, tasks);
        }
    }

    updateTasks(eventName, taskId, currTime, newTasks){

        var self = this;

        //toggle pause/play if this was caused by clicking a button
        if(eventName === "clicked" || eventName === "submitted-playing"){
            newTasks = this.setTaskStates(taskId, newTasks);
        }

        if(eventName !== "submitted-paused"){
            newTasks = this.setTaskTimes(taskId, currTime, newTasks);
        }
        
        newTasks = this.assignColors(newTasks);
        newTasks = this.parseTimes(newTasks);

        self.setState({tasks: newTasks}, function(){

            if(eventName === "clicked"){
                self.startTimerInterval(taskId);
            }
            else if(eventName === "submitted-playing" || eventName === "submitted-paused"){
                self.postTaskUpdate(userId, taskId, self.state.tasks[taskId].title, self.state.tasks[taskId].state, self.state.tasks[taskId].duration);
            }
        });
    }

    updateTimerDuration(stillPlaying, taskId, tasks){

        if(tasks[taskId].startTime && tasks[taskId].stopTime){
            
            var difference = Math.floor((tasks[taskId].stopTime - tasks[taskId].startTime)/1000);
            tasks[taskId].duration = parseInt(tasks[taskId].duration) + difference;

            if(stillPlaying){
                tasks[taskId].startTime = tasks[taskId].stopTime;
                tasks[taskId].stopTime = null;
            }
            else{
                tasks[taskId].startTime = null;
                tasks[taskId].stopTime = null;
            }
            
        }

        return tasks;
    }
}

export default TimeTracker;

// We only want to try to render our component on pages that have a div with an ID
// of "example"; otherwise, we will see an error in our console 
if (document.getElementById('task-window')) {
    ReactDOM.render(<TimeTracker />, document.getElementById('task-window'));
}