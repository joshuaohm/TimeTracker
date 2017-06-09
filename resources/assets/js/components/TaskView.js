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


                    /* Come Back to this next
                    fetch('/api/hours'+userId)
                        .then(response => {
                            return response.json();
                        })
                        .then(


                        );

                    */
                
                    
                    this.setState({tasks:tasks, userId:userId});
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

        var self = this;
        var tasks = this.state.tasks;
        tasks.splice(this.getTaskIndex(taskId, tasks), 1);
        tasks = this.assignColors(tasks);

        this.setState({tasks}, function(){
           self.postDeleteTask(taskId);
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
        self.setState({tasks}, function(){
            var taskIndex = self.getTaskIndex(taskId, self.state.tasks);
            self.postTaskUpdate(taskId, self.state.tasks[taskIndex].title, self.state.tasks[taskIndex].state, self.state.tasks[taskIndex].duration);
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

        //Check if newHour is numeric, Format hour to leading zeros if less than 10, and get rid of negative values

        if(isNaN(newHour) || newHour === ""){
            newHour = isNaN(parseInt(newTask.hour)) ? "00" : newTask.hour;
            e.target.value = newHour;
        }

        if(parseInt(newHour) < 0){
            newHour = "00";
            e.target.value = newHour;
        }

        newTask.hour = newHour;
        newTask = this.parseTimeReverse(newTask);
        newTasks[taskIndex] = newTask;

        newTasks = this.parseTimes(newTasks);

        this.setState({tasks: newTasks});        
        
    }

    handleViewHoursButton(){

        this.setState({view: "hours"});   
    }

    handleMinuteChange(e){

        //Event when an task's hour value is edited

        var taskId = $(e.target).attr("data-task");
        var newMinute = e.target.value;
        var newTasks = this.state.tasks;
        var taskIndex = this.getTaskIndex(taskId, newTasks);
        var newTask = newTasks[taskIndex];

        //Check if newHour is numeric, Format hour to leading zeros if less than 10, and get rid of negative values

        if(isNaN(newMinute) || newMinute === ""){
            newMinute = isNaN(parseInt(newTask.minute)) ? "00" : newTask.minute;
            e.target.value = newMinute;
        }

        if(parseInt(newMinute) < 0 || parseInt(newMinute) > 59 || newMinute.length > 2){
            newMinute = isNaN(parseInt(newTask.minute)) ? "00" : newTask.minute;
            e.target.value = newMinute;
        }

        newTask.minute = newMinute;
        newTask = this.parseTimeReverse(newTask);
        newTasks[taskIndex] = newTask;

        newTasks = this.parseTimes(newTasks);

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
        var taskIndex = this.getTaskIndex(taskId, newTasks);
        var newTask = newTasks[taskIndex];

        if(parseInt(newHour) < 10 && newHour.charAt(0) != '0' || newHour === "0"){
            newHour = "0" + newHour;
            e.target.value = newHour;
        }
        else if(parseInt(newHour) > 9 && newHour.charAt(0) == '0'){
            newHour = newHour.replace(/^0+/, '');
            e.target.value = newHour;
        }

        newTask.hour = newHour;
        newTask = self.parseTimeReverse(newTask);
        newTasks[self.getTaskIndex(taskId, newTasks)] = newTask;

        newTasks = self.parseTimes(newTasks);


        self.setState({tasks: newTasks}, function(){

            self.postTaskUpdate(taskId, self.state.tasks[taskIndex].title, self.state.tasks[taskIndex].state, self.state.tasks[taskIndex].duration);
        });
    }

    onMinuteBlur(e){

        //Format minute once focus is left (turn 0's into 00's)
        var self = this;
        var taskId = $(e.target).attr("data-task");
        var newMinute = e.target.value;
        var newTasks = this.state.tasks;
        var taskIndex = self.getTaskIndex(taskId, newTasks);
        var newTask = newTasks[taskIndex];

        if(parseInt(newMinute) < 10 && newMinute.charAt(0) != '0' || newMinute === "0"){
            newMinute = "0" + newMinute;
            e.target.value = newMinute;
        }

        newTask.minute = newMinute;
        newTask = self.parseTimeReverse(newTask);
        newTasks[taskIndex] = newTask;

        newTasks = self.parseTimes(newTasks);

        self.setState({tasks: newTasks}, function(){

            self.postTaskUpdate(taskId, self.state.tasks[taskIndex].title, self.state.tasks[taskIndex].state, self.state.tasks[taskIndex].duration);
        });
    }

    onTitleBlur(e){

        var self = this;
        var taskId = $(e.target).attr("data-task");
        var taskIndex = self.getTaskIndex(taskId, self.state.tasks);

        self.postTaskUpdate(taskId, self.state.tasks[taskIndex].title, self.state.tasks[taskIndex].state, self.state.tasks[taskIndex].duration);
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

            tasks[i].hour = Math.floor(tasks[i].duration / 3600);
            tasks[i].minute = Math.floor((tasks[i].duration % 3600) / 60);
        
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
                taskList = this.setTaskTime(i+1, currTime, taskList);
            }         
        }

        return taskList;
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
            success: self.submitSucceeded.bind(this),
            dataType: "json"
        });
    }

    postTaskHours(taskId){
        
        var self = this;

        $.ajax({
            method: "POST",
            url: "/api/hours",
            data: {
                "userId":self.state.userId,
                "taskId": taskId,
                "duration": self.state.tasks[taskId-1].duration,
                "name": self.state.tasks[taskId-1].title
            },
            success: self.submitSucceeded.bind(this),
            dataType: "json"
        });
    }

    postTaskUpdate(taskId, title, state, duration, submitted=false){

        //Post a task's information for updating in the DB
        var self = this;

        if(submitted){
            var postData = {
                "userId":self.state.userId,
                "taskId": taskId,
                "name": title,
                "status": 'paused',
                "duration": duration,
                "submitted": submitted
            };
        }
        else{
            var postData = {
                "userId":self.state.userId,
                "taskId": taskId,
                "name": title,
                "status": 'paused',
                "duration": duration
            };
        }

        $.ajax({
            method: "POST",
            url: "/api/task",
            data: postData,
            success: self.submitSucceeded.bind(this),
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
                        <HoursView handleReturnButton={this.handleReturnButton.bind(this)}/>
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
                                            defaultValue={task.hour} />
                                    </div>
                                    <div className="colon"> 
                                        <span className={"animation-colon "+task.state}>:</span>
                                    </div>
                                    <div className="minute" data-task={ task.id }>
                                        <input type="text" data-task={task.id} id={"minute-"+task.id }  
                                            onChange={this.handleMinuteChange.bind(this)}
                                            onBlur={this.onMinuteBlur.bind(this)}
                                            defaultValue={task.minute} />
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

    setTaskState(taskId, tasks){

        var taskIndex = this.getTaskIndex(taskId, tasks);

        if(tasks.length > 0){
            if(tasks[taskIndex].state === 'play'){
                tasks[taskIndex].state = 'paused';
            }
            else if(tasks[taskIndex].state === 'paused'){
                tasks = this.pauseAllTasks(tasks);
                tasks[taskIndex].state = 'play';
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

        if(taskId === this.getActiveTask()){

            var self = this;
            var newTasks = self.state.tasks;
            var currTime = new Date().getTime();

            //The amount of time (in seconds) remaining until the timer should update visually
            var updateTime = 60 - (newTasks[self.getTaskIndex(taskId, newTasks)].duration % 60);

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
        
        if(data.result === "success" && data.submitted === "true"){
            this.postTaskHours(data.id);
        }

    }

    submitTask(taskId){

        var self = this;
        var curr = new Date().getTime();
        var tasks = self.state.tasks;

        if(tasks[this.getTaskIndex(taskId, tasks)].state === "play"){
            self.updateTasks("submitted-playing", taskId, curr, tasks);
        }
        else{
            self.updateTasks("submitted-paused", taskId, curr, tasks);
        }
    }

    updateTasks(eventName, taskId, currTime, newTasks){

        var self = this;

        //toggle pause/play if this was caused by clicking the timer button
        if(eventName === "clicked" || eventName === "submitted-playing"){
            newTasks = this.setTaskState(taskId, newTasks);
        }

        if(eventName !== "submitted-paused"){
            newTasks = this.setTaskTime(taskId, currTime, newTasks);
        }
        
        newTasks = this.assignColors(newTasks);
        newTasks = this.parseTimes(newTasks);

        self.setState({tasks: newTasks}, function(){

            var taskIndex = self.getTaskIndex(taskId, self.state.tasks);

            if(eventName === "clicked"){
                self.startTimerInterval(taskId);
                self.postTaskUpdate(taskId, self.state.tasks[taskIndex].title, self.state.tasks[taskIndex].state, self.state.tasks[taskIndex].duration);
            }
            else if(eventName === "submitted-playing" || eventName === "submitted-paused"){
                self.postTaskUpdate(taskId, self.state.tasks[taskIndex].title, self.state.tasks[taskIndex].state, self.state.tasks[taskIndex].duration, true);
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