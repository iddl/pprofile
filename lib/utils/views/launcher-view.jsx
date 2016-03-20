'use babel'
/** @jsx etch.dom */

import etch from 'etch';

class LauncherView {

  constructor (props) {
    this.props = props;
    etch.initialize(this)
  }

  runClick() {
    var editor = this.refs.editor.getModel();
    this.props.onRun(editor.getText());
  }

  render () {
    var props = this.props;

    if(!props.show){
        return <div></div>;
    }

    var loaderClass = '';
    if(props.status === 'running'){
        loaderClass = 'loader';
    }

    return (
        <div className='pprofile-launcher'>
            <section className='input-block'>
                <div className='input-block-item input-block-item--flex editor-container'>
                    <atom-text-editor ref='editor'/>
                </div>
                <div className='input-block-item'>
                    <div className='btn-group btn-group-run'>
                        <button onclick={this.runClick.bind(this)} className='btn'>
                            <span className='text'>Run</span>
                            <div className={loaderClass}/>
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
  }

  // For now simply don't care about doing
  // elaborate logic to save pretty much nothing
  update (props) {
    Object.assign(this.props, props)
    return etch.update(this);
  }

  async destroy () {
    await etch.destroy(this)
  }
}

export default LauncherView
