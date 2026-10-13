const { Component } = require('inferno');

module.exports = class extends Component {
    render() {
        const { clientId, slotId, format = 'auto', layout, title = '广告' } = this.props;
        return <div class="card widget adsense-widget">
            <div class="card-content">
                <h3 class="menu-label adsense-label">{title}</h3>
                <div class="google-ad-unit"
                    data-ad-client={clientId}
                    data-ad-slot={slotId}
                    data-ad-format={format}
                    data-ad-layout={layout} />
            </div>
        </div>;
    }
};
