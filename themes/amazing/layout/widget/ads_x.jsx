const {Component} = require('inferno');
const {cacheComponent} = require('hexo-component-inferno/lib/util/cache');
const AdUnit = require('./ad_unit');

class AdSenseX extends Component {
    render() {
        const {clientId, slotId, format, layout} = this.props;
        return <AdUnit clientId={clientId} slotId={slotId} format={format} layout={layout} />;
    }
}

module.exports = cacheComponent(AdSenseX, 'widget.adsense_x', props => {
    const {config, display} = props;
    const {adsense_client_id, adsense_slot_id, adsense_display_slot_id} = config;
    const slotId = adsense_display_slot_id || adsense_slot_id;
    if (!adsense_client_id || !slotId || !display) {
        return null;
    }
    return {
        clientId: adsense_client_id,
        slotId,
        // 展示广告与文章内广告保留各自格式，不能仅修改 format 复用不同类型的单元。
        format: adsense_display_slot_id ? 'auto' : 'fluid',
        layout: adsense_display_slot_id ? undefined : 'in-article'
    };
});
