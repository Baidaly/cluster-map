import Feature from 'ol/Feature';
import ImageLayer from 'ol/layer/Image';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import Map from 'ol/Map';
import Point from 'ol/geom/Point';
import {
  Circle as CircleStyle,
  Fill,
  Stroke,
  Style,
  Text,
} from 'ol/style';
import {Cluster, OSM, Vector as VectorSource} from 'ol/source';
import {boundingExtent} from 'ol/extent';
import Projection from 'ol/proj/Projection';
import Static from 'ol/source/ImageStatic';
import View from 'ol/View';
import {getCenter} from 'ol/extent';

// Map views always need a projection.  Here we just want to map image
// coordinates directly to map coordinates, so we create a projection that uses
// the image extent in pixels.
const extent = [0, 0, 1024, 968];
const projection = new Projection({
  code: 'xkcd-image',
  units: 'pixels',
  extent: extent,
});

function random(min, max) {
  return min + Math.random() * (max - min);
}

const count = 300;
const features = new Array(count);
for (let i = 0; i < count; ++i) {
  const coordinates = [random(0, extent[2]), random(0, extent[3])];
  features[i] = new Feature(new Point(coordinates));
}

const source = new VectorSource({
  features: features,
});

const clusterSource = new Cluster({
  distance: 100,
  minDistance: 50,
  source: source,
});

const styleCache = {};
const clusters = new VectorLayer({
  source: clusterSource,
  style: function (feature) {
    const size = feature.get('features').length;
    let style = styleCache[size];
    if (!style) {
      style = new Style({
        image: new CircleStyle({
          radius: 10,
          stroke: new Stroke({
            color: '#fff',
          }),
          fill: new Fill({
            color: '#3399CC',
          }),
        }),
        text: new Text({
          text: size.toString(),
          fill: new Fill({
            color: '#fff',
          }),
        }),
      });
      styleCache[size] = style;
    }
    return style;
  },
});

const map = new Map({
  layers: [
    new ImageLayer({
      source: new Static({
        attributions: '© <a href="https://xkcd.com/license.html">xkcd</a>',
        url: 'https://imgs.xkcd.com/comics/online_communities.png',
        projection: projection,
        imageExtent: extent,
      }),
    }),
    clusters,
  ],
  target: 'map',
  view: new View({
    projection: projection,
    center: getCenter(extent),
    zoom: 2,
    maxZoom: 8,
  }),
});

map.on('click', (e) => {
  clusters.getFeatures(e.pixel).then((clickedFeatures) => {
    if (clickedFeatures.length) {
      // Get clustered Coordinates
      const features = clickedFeatures[0].get('features');
      if (features.length > 1) {
        const extent = boundingExtent(
          features.map((r) => r.getGeometry().getCoordinates())
        );
        map.getView().fit(extent, {duration: 1000, padding: [50, 50, 50, 50]});
      }
    }
  });
});
