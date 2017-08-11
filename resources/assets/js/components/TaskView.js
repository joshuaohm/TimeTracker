import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import Modal from './Modal';
import Confirm from './Confirm';
import HoursView from './HoursView';

class TaskView extends Component {

    constructor(props) {
        super(props);

        this.state = {
            tasks: [],
            hours: [],
            userId: '',
            view: 'tasks',
            initialized: false
        };

    }

    componentDidMount(){

        //when the application initializes
        //Grab the user's tasks from the database, use this to set the state

        if(userId !== null && this.state.initialized === false){
            fetch('/api/tasks/'+userId)
                .then(response => {
                    return response.json();
                })
                .then(tasks => {

                    tasks = this.assignColors(tasks);
                    tasks = this.parseTimes(tasks);


                    fetch('/api/hours/'+userId)
                        .then(response => {
                            return response.json();
                        })
                        .then(hours => {

                            hours = this.parseTimes(hours);
                            hours = this.assignColors(hours);
                            this.setState({tasks:tasks, userId:userId, hours:hours, initialized:true});
                        });    
            });
        }
    }

    addDuration(taskId, currTime, tasks){

        var taskIndex = this.getTaskIndex(taskId, tasks);
        var diff = (currTime - tasks[taskIndex].startTime);

        if(diff < 1000 && diff >= 500){
            diff = 1000;
        }

        diff = Math.floor(diff / 1000);

        tasks[taskIndex].duration += diff;

        return tasks;
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

    clearDuration(taskId){

        var tasks = this.state.tasks;
        tasks[this.getTaskIndex(taskId, tasks)].duration = 0;
        tasks = this.parseTimes(tasks);
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

    deleteHours(taskId){
        this.postDeleteHours(taskId);
    }

    deleteHoursSucceeded(data){

        this.getHourInfo();
    }

    deleteTask(taskId){

        var self = this;
        var tasks = this.state.tasks;
        tasks.splice(this.getTaskIndex(taskId, tasks), 1);
        tasks = this.assignColors(tasks);

        this.setState({tasks}, function(){
           self.postDeleteTask(taskId);
        });
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

    getActiveDuration(taskId, tasks){

        //returns the value of a task's duration + the difference in it's timer's start time until now
        //(Basically, returns the time the front end should display while the task's timer is actively running)

        var currTime = new Date().getTime();

        var taskIndex = this.getTaskIndex(taskId, tasks);

        var diff = Math.floor((currTime - tasks[taskIndex].startTime) / 1000);

        return tasks[taskIndex].duration + diff;
    }

    getHours(){

        return this.state.hours;
    }

    getHourInfo(){

        $.ajax({
            method: "GET",
            url: "/api/hours/"+this.state.userId, 
            success: function(data){
                var newHours = this.parseTimes(data);
                newHours = this.assignColors(newHours);
                this.setState({hours: newHours});
            }.bind(this)
        });
    }

    getHourInfoAndUpdate(taskId, self){

         $.ajax({
            method: "GET",
            url: "/api/hours/"+self.state.userId, 
            success: function(data){
                self.getHourSucceeded(self, data, taskId);
            }.bind(self)
        });
    }

    getHourSucceeded(self, hours, taskId){

        var newHours = self.parseTimes(hours);
        newHours = self.assignColors(newHours);

        var newTasks = self.clearDuration(taskId);
        
        /*** For some god awful reason, setState AND the forceUpdate were failing to make the taskView rerender (times on the submitted task were not being zeroed out even though state had changed). 
        ***  My stupid work around was to change the view to the hours page, which works for some reason.
        */
        self.setState({tasks: newTasks, hours: newHours, view:'hours'}, function(){
            self.forceUpdate();
        });

    }

    getTaskIndex(taskId, tasks){

        //Returns task's index in the task list
        var index = -1;

        for(var i = 0; i < tasks.length; i++){
            if(tasks[i].id === parseInt(taskId)){
                index = i;
            }
        }

        return index;
    }

    handleAddTaskButton(e){

        //Event when add task button is clicked

        e.preventDefault();
        var self = this;

        if(self.state.tasks.length === 0){
            var taskId = 1;
        }
        else{
            var taskId = self.state.tasks[self.state.tasks.length-1].id+1;
        }
        
        var title = "New Task";
        var duration = 0;

        var newTask = {
            'ownerId': self.state.userId,
            'id': taskId,
            'title': title,
            'state': 'paused',
            'status': 'active',
            'duration': 0
        }

        var tasks = self.state.tasks;

        tasks.push(newTask);
        tasks = self.assignColors(tasks);
        tasks = self.parseTimes(tasks);

        self.setState({tasks:tasks}, function(){
            var taskIndex = self.getTaskIndex(taskId, self.state.tasks);
            self.postTaskUpdate(taskId, self.state.tasks[taskIndex].title, self.state.tasks[taskIndex].state, self.state.tasks[taskIndex].duration, 0);
        });
    }

    handleDeleteButton(e){

        //Event when delete task button is clicked

        var self = this;
        var taskId = $(e.target).attr("data-task");

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

    handleHourChange(e){

        //Event when an task's hour value is edited

        var taskId = $(e.target).attr("data-task");
        var newHour = e.target.value;
        var newTasks = this.state.tasks;
        var taskIndex = this.getTaskIndex(taskId, newTasks);
        var newTask = newTasks[taskIndex];

        //remove any non numeric characters or empty strings (default to 00)
        if(newHour.match(/^[0-9]+$/) == null || newHour === ""){
            newHour = newTask.minute;
        }

        newTask.hour = newHour;
        newTasks[taskIndex] = newTask;


        this.setState({tasks: newTasks});        
        
    }

    handleViewHoursButton(){

        this.setState({view: "hours"});   
    }

    handleMinuteChange(e){

        //Event when an task's minute value is edited

        var taskId = $(e.target).attr("data-task");
        var newMinute = e.target.value;
        var newTasks = this.state.tasks;
        var taskIndex = this.getTaskIndex(taskId, newTasks);
        var newTask = newTasks[taskIndex];

        //remove any non numeric characters or empty strings (default to 00)
        if(newMinute.match(/^[0-9]+$/) == null || newMinute === ""){
            newMinute = newTask.minute;
        }

        newTask.minute = newMinute;
        newTasks[taskIndex] = newTask;

        this.setState({tasks: newTasks});        
        
    }

    handleReturnButton(){

      this.setState({view: "tasks"});   
    }

    handleTimerButton(e){

        //Event when play button is clicked on a task

        var taskId = $(e.target).attr("data-task");
        var newTasks = this.state.tasks;
        var clickTime = new Date().getTime();

        this.updateTasks("clicked", taskId, clickTime, newTasks);
    }

    handleTitleChange(e){

        //Event when an task's title is edited
        var taskId = $(e.target).attr("data-task");
        var newTasks = this.state.tasks;

        var newTitle = e.target.value;


        newTasks[this.getTaskIndex(taskId, newTasks)].title = newTitle;
        this.setState({tasks: newTasks});    

    }

    handleSubmitButton(e){

        //Event when the upload button is clicked on an event

        var self = this;
        var taskId = $(e.target).attr("data-task");

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

    onHourBlur(e){

        //Format hour value once focus is left (turn 0's into 00's and remove extra leading 0's)
        var self = this;
        var taskId = $(e.target).attr("data-task");
        var newHour = e.target.value;
        var newTasks = this.state.tasks;
        var taskIndex = self.getTaskIndex(taskId, newTasks);
        var newTask = newTasks[taskIndex];
        var valid = true;

        newHour = this.stripLeadingZeroes(newHour);

        if(newHour === ""){
            newHour = "00";
            valid = false;
        }

        if(newHour.match(/^[0-9]+$/) == null){
            newHour = self.state.tasks[taskIndex].hasOwnProperty("oldHour") ? newTask.oldHour : "00";
            valid = false;
        }

        if(parseInt(newHour) < 0){
            newHour = newTask.hasOwnProperty("oldHour") && newTask.oldHour > 0 ? newTask.oldHour : "00";
            valid = false;
        }

        else if(parseInt(newHour) < 10 && newHour.charAt(0) != '0' || newHour === "0"){
            newHour = "0" + newHour;
            valid = false;
        }

        if(valid){
            newTask.oldHour = newTask.hour;
        }

        newTask.hour = newHour;
        newTask = self.parseTimeReverse(newTask);
        newTasks[taskIndex] = newTask;

        newTasks = self.parseTimes(newTasks);

        self.setState({tasks: newTasks}, function(){

            self.postTaskUpdate(taskId, self.state.tasks[taskIndex].title, self.state.tasks[taskIndex].state, self.state.tasks[taskIndex].duration, self.state.tasks[taskIndex].startTime);
        });
    }

    onMinuteBlur(e){

        //Format minute once focus is left (error check and turn 0's into 00's)
        var self = this;
        var taskId = $(e.target).attr("data-task");
        var newMinute = e.target.value;
        var newTasks = this.state.tasks;
        var taskIndex = self.getTaskIndex(taskId, newTasks);
        var newTask = newTasks[taskIndex];
        var valid = true;

        newMinute = this.stripLeadingZeroes(newMinute);

        if(newMinute === ""){
            newMinute = "00";
            valid = false;
        }

        if(newMinute.match(/^[0-9]+$/) == null){
            newMinute = self.state.tasks[taskIndex].hasOwnProperty("oldMinute") ? newTask.oldMinute : "00";
            valid = false;
        }

        if(parseInt(newMinute) > 59 || parseInt(newMinute) < 0 || newMinute.length > 2){
            newMinute = newTask.hasOwnProperty("oldMinute") && newTask.oldMinute > 0 ? newTask.oldMinute : "00";
            valid = false;
        }

        else if(parseInt(newMinute) < 10 && newMinute.charAt(0) != '0' || newMinute === "0"){
            newMinute = "0" + newMinute;
            valid = false;
        }

        if(valid){
            newTask.oldMinute = newTask.minute;
        }
        
        newTask.minute = newMinute;
        newTask = self.parseTimeReverse(newTask);
        newTasks[taskIndex] = newTask;

        newTasks = self.parseTimes(newTasks);

        self.setState({tasks: newTasks}, function(){

            self.postTaskUpdate(taskId, self.state.tasks[taskIndex].title, self.state.tasks[taskIndex].state, self.state.tasks[taskIndex].duration, self.state.tasks[taskIndex].startTime);
        });
    }

    onTitleBlur(e){

        var self = this;
        var taskId = $(e.target).attr("data-task");
        var taskIndex = self.getTaskIndex(taskId, self.state.tasks);

        self.postTaskUpdate(taskId, self.state.tasks[taskIndex].title, self.state.tasks[taskIndex].state, self.state.tasks[taskIndex].duration, self.state.tasks[taskIndex].startTime, true);
    }

    parseTimeReverse(task){

        //Takes the task's current hour and minute values and converts that into the new duration (seconds)

        //This will drop some seconds off an existing timer.
        var hourSeconds = parseInt(task.hour) * 3600;
        var minuteSeconds = parseInt(task.minute) * 60;

        task.duration = hourSeconds + minuteSeconds;

        return task;
    }

    parseTimes(tasks){

        //Convert a task's duration (seconds) into hours and minutes and adds this to the task in state

        for(var i = 0; i < tasks.length; i++){

            var duration = tasks[i].duration;

            if(tasks[i].state === 'play' && tasks[i].hasOwnProperty('startTime') && tasks[i].startTime !== 0){

                //Work with the duration that should be displayed on front end if this task is currently running

                duration = this.getActiveDuration(tasks[i].id, tasks);
            }

            tasks[i].hour = Math.floor(duration / 3600);
            tasks[i].minute = Math.floor((duration % 3600) / 60);
        
            if(parseInt(tasks[i].hour) < 10){
                tasks[i].hour = "0"+tasks[i].hour;
            }

            if(parseInt(tasks[i].minute) < 10){
                tasks[i].minute = "0"+tasks[i].minute;
            }
        }

        return tasks;
    }

    pauseAllTasks(taskList){

        //Pauses all tasks

        for(var i = 0; i < taskList.length; i++){
            if(taskList[i].state === 'play'){

                taskList[i].state = 'paused';
                var currTime = new Date().getTime();
                taskList = this.updatePausedTask(taskList[i].id, currTime, taskList);
            }         
        }

        return taskList;
    }

    postDeleteHours(taskId){

         var self = this;

        $.ajax({
            method: "POST",
            url: "/api/hours/delete",
            data: {
                "userId":self.state.userId,
                "taskId": taskId
            },
            success: self.deleteHoursSucceeded.bind(self, {taskId:taskId}),
            dataType: "json"
        });

    }

    postDeleteTask(taskId){

        var self = this;

        $.ajax({
            method: "POST",
            url: "/api/task/delete",
            data: {
                "userId":self.state.userId,
                "taskId": taskId
            },
            success: self.submitSucceeded.bind(self),
            dataType: "json"
        });
    }

    postTaskHours(taskId, title, state, duration, submitted=false){
        
        var self = this;

        $.ajax({
            method: "POST",
            url: "/api/task-hours", 
            data: {
                "userId":self.state.userId,
                "taskId": taskId,
                "duration": duration,
                "name": title,
                "status": 'paused'
            },
            success: self.submitSucceeded.bind(self),
            dataType: "json"
        });
    }

    postTaskUpdate(taskId, title, state, duration, startTime, updateHours=false){

        //Post a task's information for updating in the DB
        var self = this;

        if(updateHours){
            var postData = {
                "userId":self.state.userId,
                "taskId": taskId,
                "name": title,
                "status": state,
                "duration": duration,
                "startTime": startTime,
                "hours": updateHours
            };
        }
        else{
            var postData = {
                "userId":self.state.userId,
                "taskId": taskId,
                "name": title,
                "status": state,
                "duration": duration,
                "startTime": startTime
            };
        }

        $.ajax({
            method: "POST",
            url: "/api/task",
            data: postData,
            success: self.submitSucceeded.bind(self),
            dataType: "json"
        });
    }

    render() {

        //Main render call of entire application
        if(this.state.userId === -1){
            return (
                
                    <div className="login-prompt" id="main-window">
                        <a href="/login">
                            Please Log in
                        </a>
                    </div>
                
            );
        }
        else{
            if(this.state.view === "tasks"){
                return (
                    <div className="tasks-list" id="main-window">
                        <div className="tasks-view">
                            <div className="buttons-row">
                                <div className="left-wrapper">
                                    <div className="add-task" onClick={this.handleAddTaskButton.bind(this)}>+</div>
                                </div>
                                <div className="right-wrapper">
                                    <div className="view-hours" onClick={this.handleViewHoursButton.bind(this)}>
                                        <div className="text icon-clock"></div>
                                    </div>
                                </div>
                            </div>
                            { this.renderTasks() }
                        </div>
                    </div>
                );
            }
            else if(this.state.view === "hours"){
                return (
                    <div className="tasks-list" id="main-window">
                        <HoursView deleteHours={this.deleteHours.bind(this)} handleReturnButton={this.handleReturnButton.bind(this)} getHours={this.getHours.bind(this)}/>
                    </div>
               );
            }
            
        }
        
    }
    

    renderTasks() {

        //Renders each task in the list

        if(this.state.tasks.length === 0 || this.state.tasks == null){
            return (<div></div>);
        }
        else{

            return this.state.tasks.map(task => {

                if(task.status === "active"){
                    return (

                        <div className={ "task color-"+task.color } key={ task.id } data-task={ task.id }>
                            <div className="title" data-task={ task.id }>
                                <input type="text" data-task={ task.id } id={"title-"+task.id }  
                                    onChange={this.handleTitleChange.bind(this)} 
                                    onBlur={this.onTitleBlur.bind(this)}
                                    defaultValue={task.title} />
                            </div>
                            <div className="time">
                                <div className="time-wrapper">
                                    <div className="hour" data-task={ task.id }>
                                        <input type="text" data-task={task.id} id={"hour-"+task.id }  
                                            onChange={this.handleHourChange.bind(this)}
                                            onBlur={this.onHourBlur.bind(this)}
                                            value={task.hour} />
                                    </div>
                                    <div className="colon"> 
                                        <span className={"animation-colon "+task.state}>:</span>
                                    </div>
                                    <div className="minute" data-task={ task.id }>
                                        <input type="text" data-task={task.id} id={"minute-"+task.id }  
                                            onChange={this.handleMinuteChange.bind(this)}
                                            onBlur={this.onMinuteBlur.bind(this)}
                                            value={task.minute} />
                                    </div>
                                </div>
                            </div>
                            <div className="buttonHolder">
                                <div className="upload-btn icon-upload-cloud" data-task={task.id} onClick={this.handleSubmitButton.bind(this)}></div>
                                <div className="timer-btn" data-state={ task.state } data-task={ task.id } onClick={this.handleTimerButton.bind(this)}>{this.renderTimerButton(task.state, task.id)}</div>
                                <div className="delete-btn icon-trash" data-task={task.id} onClick={this.handleDeleteButton.bind(this)}></div>
                            </div>
                        </div>
                    );
                }
            });
        }
    }

    renderTimerButton(state, taskId){

        //Determines if a task's button should display as pause or play and renders it

        if(state === "play"){
            return(
                <div className="icon-pause" data-task={taskId}></div>
            );        
        }
        else if(state === "paused"){
            return (
                <div className="icon-play" data-task={taskId}></div>
            );
        }
    }

    setTaskState(taskId, currTime, tasks){

        var taskIndex = this.getTaskIndex(taskId, tasks);

        if(tasks.length > 0){
            if(tasks[taskIndex].state === 'play'){

                tasks[taskIndex].state = 'paused';
                tasks = this.updatePausedTask(taskId, currTime, tasks);
            }
            else if(tasks[taskIndex].state === 'paused'){

                tasks = this.pauseAllTasks(tasks);
                tasks[taskIndex].state = 'play';
                tasks[taskIndex].startTime = currTime;
            }
        }

        return tasks;
    }

    setTaskTime(taskId, currTime, tasks){

        var taskIndex = this.getTaskIndex(taskId, tasks);

        //Case 1, task was playing all ready, still playing
        if(tasks[taskIndex].state === 'play' && Number.isInteger(tasks[taskIndex].startTime)){

            //Smooth Sailing -- if there's an error at this part, do nothing.
            if(tasks[taskIndex].startTime && !Number.isInteger(tasks[taskIndex].stopTime)){
                tasks[taskIndex].stopTime = currTime;
                tasks = this.updateTimerDuration(true, taskId, tasks);
            }
        }
        //Case 2, task was just started
        else if(tasks[taskIndex].state === 'play' && !Number.isInteger(tasks[taskIndex].startTime) && !Number.isInteger(tasks[taskIndex].stopTime)){
            tasks[taskIndex].startTime = currTime;
        }
        //Case 3, task was just paused
        else if(tasks[taskIndex].state === 'paused' && Number.isInteger(tasks[taskIndex].startTime) && !Number.isInteger(tasks[taskIndex].stopTime)){
            tasks[taskIndex].stopTime = currTime;
            tasks = this.updateTimerDuration(false, taskId, tasks);
        }

        return tasks;
    }

    startTimerInterval(taskId){

        if(this.getTaskIndex(taskId, this.state.tasks) === this.getActiveTask()){

            var self = this;

            setTimeout(function(){

                self.updateTasks('interval', taskId, new Date().getTime(), self.state.tasks);
            }, 1000);
        }
    }

    stripLeadingZeroes(timeString){

        while(timeString.length > 2){

            if(timeString.substring(0,1) === '0'){
                timeString = timeString.substring(1,timeString.length);
            }
            else{
                break;
            }
        }

        return timeString;
    }

    submitSucceeded(data){

        var self = this;

        //console.log("from server");
        //console.log(data);

        if(data.result === 'success' && data.hasOwnProperty('taskId') && Number.isInteger(data.taskId) && data.taskId > 0){

            this.getHourInfoAndUpdate(data.taskId, self);
        }
        else if(data.result === 'success' && data.hasOwnProperty('update') && data.update === "hours"){

            this.getHourInfo();
        }

    }

    submitTask(taskId){

        var self = this;
        var curr = new Date().getTime();
        var tasks = self.state.tasks;

        if(tasks[self.getTaskIndex(taskId, tasks)].state === "play"){
            //self.updateTasks("submitted-playing", taskId, curr, tasks);
            var newTasks = self.setTaskState(taskId, curr, tasks);
        }
        else{
            //self.updateTasks("submitted-paused", taskId, curr, tasks);
            var newTasks = self.setTaskTime(taskId, curr, tasks);
        }

        newTasks = self.assignColors(newTasks);
        newTasks = self.parseTimes(newTasks);

        self.postTaskHours(taskId, newTasks[self.getTaskIndex(taskId, newTasks)].title, newTasks[self.getTaskIndex(taskId, newTasks)].state, newTasks[self.getTaskIndex(taskId, newTasks)].duration, true);
    }

    updatePausedTask(taskId, currTime, tasks){

        var taskIndex = this.getTaskIndex(taskId, tasks);

        if(tasks[taskIndex].state === 'paused'){

            tasks = this.addDuration(taskId, currTime, tasks);
            tasks[taskIndex].startTime = 0;
        }
        
        return tasks
    }

    updateTasks(eventName, taskId, currTime, newTasks){

        var self = this;

        //toggle pause/play if this was caused by clicking the timer button
        if(eventName === "clicked"){
            newTasks = this.setTaskState(taskId, currTime, newTasks);
        }
        
        newTasks = this.assignColors(newTasks);
        newTasks = this.parseTimes(newTasks);

        

        this.setState({tasks: newTasks}, function(){

            var taskIndex = self.getTaskIndex(taskId, self.state.tasks);

            if(eventName === "clicked"){
                self.startTimerInterval(taskId);
                self.postTaskUpdate(taskId, self.state.tasks[taskIndex].title, self.state.tasks[taskIndex].state, self.state.tasks[taskIndex].duration, self.state.tasks[taskIndex].startTime);
            }
            else if(eventName === "interval"){
                self.startTimerInterval(taskId);
            }
        });
    }

    updateTimerDuration(stillPlaying, taskId, tasks){

        var taskIndex = this.getTaskIndex(taskId, tasks);

        if(tasks[taskIndex].startTime && tasks[taskIndex].stopTime){
            
            var difference = Math.floor((tasks[taskIndex].stopTime - tasks[taskIndex].startTime)/1000);
            tasks[taskIndex].duration = parseInt(tasks[taskIndex].duration) + difference;

            if(stillPlaying){
                tasks[taskIndex].startTime = tasks[taskIndex].stopTime;
                tasks[taskIndex].stopTime = null;
            }
            else{
                tasks[taskIndex].startTime = null;
                tasks[taskIndex].stopTime = null;
            }
            
        }

        return tasks;
    }
}

export default TaskView;

// We only want to try to render our component on pages that have a div with an ID
// of "example"; otherwise, we will see an error in our console 
if (document.getElementById('task-window')) {
    ReactDOM.render(<TaskView />, document.getElementById('task-window'));
}