const { Component } = require('inferno');

module.exports = class extends Component {
    render() {
        const { head, helper } = this.props;
        return head ? <script src={helper.url_for('/js/vendor/pace-1.0.2.min.js')}></script> : null;
    }
};
