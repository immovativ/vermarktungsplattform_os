import {
  AbstractInteraction,
  EventType,
  InteractionEvent,
  Layer,
  VcsEvent,
} from '@vcmap/core';
import { Feature } from 'ol';

class SelectInteraction extends AbstractInteraction {
  private readonly _featureClicked: VcsEvent<Feature | null>
  private readonly layer: Layer

  constructor(layer: Layer) {
    super(EventType.CLICK);

    this._featureClicked = new VcsEvent();
    this.layer = layer
    this.setActive();
  }

  get featureClicked() {
    return this._featureClicked;
  }

  getLayerFromFeature(f: Feature): string | null {
    const layerName = Reflect
        .ownKeys(f)
        .filter((i): i is symbol => typeof i == 'symbol')
        .filter((i) => i.description === 'vcsLayerName')
        .map((i) => (f as any)[i as any])[0]

    return layerName
  }

  async pipe(event: InteractionEvent): Promise<InteractionEvent> {
    if (event.feature) {
      if (!(event.feature instanceof Feature)) {
        return event
      }

      if (this.getLayerFromFeature(event.feature) != this.layer.name) {
        return event
      }

      if (event.type === EventType.CLICK) {
        this._featureClicked.raiseEvent(event.feature);
      }
    } else {
      this._featureClicked.raiseEvent(null);
    }

    return event
  }
}

export default SelectInteraction;
