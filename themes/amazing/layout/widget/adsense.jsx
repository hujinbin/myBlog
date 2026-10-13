const {Component} = require('inferno');
const {cacheComponent} = require('hexo-component-inferno/lib/util/cache');
const AdUnit = require('./ad_unit');

class AdSense extends Component {
    render() {
        const {title, clientId, slotId} = this.props;
        return <AdUnit title={title} clientId={clientId} slotId={slotId} />;
    }
}

module.exports = AdSense.Cacheable = cacheComponent(AdSense, 'widget.adsense', props => {
    const {helper, config} = props;
    const {adsense_client_id, adsense_slot_id, adsense_display_slot_id} = config;
    const slotId = adsense_display_slot_id || adsense_slot_id;
    if (!adsense_client_id || !slotId) {
        return null;
    }
    return {
        title: helper.__('widget.adsense'),
        clientId: adsense_client_id,
        slotId
    };
});
