import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

class HoursView extends Component {

  constructor(props) {
     
        super(props);

    }

    componentDidMount(){


    }

    render(){

      return (
        <div className="hours-view">
          <div className="buttons-row">
              <div className="left-wrapper">
              </div>
              <div className="right-wrapper">
                  <div className="return" onClick={this.props.handleReturnButton}>
                      <div className="text icon-undo"></div>
                  </div>
              </div>
          </div>
          {this.renderHours()}
        </div>
      );
    }

    renderHours(){

      var hours = this.props.getHours();
      console.log(hours);

      return hours.map(task => {

        return(
          <div className={"task-hours color-"+task.color} key={ task.taskId } data-task={ task.taskId }>
            <div className="title">{ task.title }</div>
            <div className="hours">{ task.hour+" hours "+task.minute+" minutes" }</div>
          </div>
        );

      });
    }
}

export default HoursView;

/*
// We only want to try to render our component on pages that have a div with an ID
// of "example"; otherwise, we will see an error in our console 
if (document.getElementById('hours-window')) {
    ReactDOM.render(<HoursView />, document.getElementById('hours-window'));
}
*/