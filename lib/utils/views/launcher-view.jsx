"use babel";
/** @jsx etch.dom */

import etch from 'etch';

class LauncherView {

    constructor(props) {
        this.props = props;
        etch.initialize(this);
    }

    runClick() {
        let editor = this.refs.editor.getModel();
        this.props.onRun(editor.getText());
    }

    setGrammar(editor) {
        let grammars = editor.grammarRegistry.grammarsByScopeName;
        let grammar = grammars[this.props.grammar];
        editor.setGrammar(grammar);
        editor.setTabLength(4);
    }

    setDefaultText(editor){
        if(editor.getText().length){
            return;
        }

        editor.setText(this.props.defaultCmd);
    }

    setupEditor(editor){
        this.setGrammar(editor);
        this.setDefaultText(editor);
    }

    // For now simply don't care about doing
    // elaborate logic to save pretty much nothing
    update(props) {
        Object.assign(this.props, props);

        return etch.update(this)
        .then((d) => {
            if (this.refs.editor) {
                this.setupEditor(this.refs.editor.getModel());
            }
            return d;
        });
    }

    async destroy() {
        await etch.destroy(this)
    }

    render() {
        let props = this.props;

        if (!props.show) {
            return <div></div>;
        }

        let loaderClass = '';
        if (props.status === 'running') {
            loaderClass = 'loader';
        }

        return (
            <div className='pprofile-launcher'>
                <section className='input-block'>
                    <div className='input-block-item input-block-item--flex editor-container'>
                        <atom-text-editor ref='editor' />
                    </div>
                    <div className='input-block-item'>
                        <div className='btn-group btn-group-run'>
                            <button onclick={ this.runClick.bind(this) } className='btn'>
                                <span className='text'>Run</span>
                                <div className={ loaderClass } />
                            </button>
                        </div>
                    </div>
                </section>
            </div>
            );
    }
}

export default LauncherView
