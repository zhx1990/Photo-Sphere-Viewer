import { DivIcon, Icon, LatLngLiteral } from 'leaflet';
import { GpsPosition, PlanHotspotStyle } from './model';

export function gpsToLeaflet(gps: GpsPosition): LatLngLiteral {
    return { lng: gps[0], lat: gps[1], alt: gps[2] };
}

export function createLeafletIcon(src: string, size: number): Icon<any> {
    if (src.includes('<svg')) {
        return new DivIcon({
            html: src,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
            className: 'psv-plan__pin',
        });
    } else {
        return new Icon({
            iconUrl: src,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
            className: 'psv-plan__pin',
        });
    }
}

export function getStyle(defaultStyle: PlanHotspotStyle, style: PlanHotspotStyle, isHover: boolean) {
    return {
        image: isHover
            ? style.hoverImage ?? style.image ?? defaultStyle.hoverImage ?? defaultStyle.image
            : style.image ?? defaultStyle.image,
        size: isHover
            ? style.hoverSize ?? style.size ?? defaultStyle.hoverSize ?? defaultStyle.size
            : style.size ?? defaultStyle.size,
        color: isHover
            ? style.hoverColor ?? style.color ?? defaultStyle.hoverColor ?? defaultStyle.color
            : style.color ?? defaultStyle.color,
        borderColor: isHover
            ? style.hoverBorderColor ?? defaultStyle.hoverBorderColor
            : 'transparent',
        borderSize: isHover
            ? style.hoverBorderSize ?? defaultStyle.hoverBorderSize
            : 0,
    };
}
