import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery'; 

//based on http://blog.arkency.com/2015/04/beautiful-confirm-window-with-react/
//and javascript implementation: https://jsfiddle.net/fernandokokocha/p9gqqgp7/
class Modal extends Component {
  constructor(props) {
    super(props);

  }

  backdrop(){
    return (
      <div className="modal-backdrop in"></div>
    );
  }

  modal(){
    var style = {display: 'block'};
    return (
      <div
        className='modal in'
        tabIndex='-1'
        role='dialog'
        aria-hidden='false'
        ref='modal'
        style={style}
      >
        <div className='modal-dialog'>
          <div className='modal-content'>
            {this.props.children}
          </div>
        </div>
      </div>
    );
  }

  render(){
    return (
      <div>
        {this.backdrop()}
        {this.modal()}
      </div>
    );
  }
}

export default Modal;