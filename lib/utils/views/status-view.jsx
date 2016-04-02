'use babel'
/** @jsx etch.dom */

import etch from 'etch';

class StatusView {

    constructor(props) {
        this.props = props;
        etch.initialize(this)
    }

    render() {
        let props = this.props;

        if (!props.show) {
            return <div></div>;
        }

        let success = props.status === 'success';
        let title = success ? 'Line profiler - Success ' : 'Line profiler - Error ';
        let hide = this.update.bind(this, {
            show: false
        });

        let message = null;
        if (props.message) {
            message = (
                <div className='tool-panel panel panel-bottom padding script-view native-key-bindings'>
                    <div className='panel-body padded output'>
                        <pre className='line stdout'>{ props.message.toString() }</pre>
                    </div>
                </div>
            )
        }

        return (
            <div className='profile-status'>
                <div className='panel-heading padded heading header-view'>
                    <span className='heading-title'>{ title }</span>
                    <span className={ success ? 'icon-check' : 'icon-alert' } />
                    <span className='heading-close icon-remove-close pull-right' onclick={ hide } />
                </div>
                { message }
            </div>
            );
    }

    // For now simply don't care about doing
    // elaborate logic to save pretty much nothing
    update(props) {
        Object.assign(this.props, props)
        return etch.update(this);
    }

    async destroy() {
        await etch.destroy(this)
    }
}

export default StatusView
