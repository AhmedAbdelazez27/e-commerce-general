import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit, input } from '@angular/core';

@Component({
  selector: 'app-model-3d-viewer',
  template: `
    <model-viewer
      [attr.src]="src() || iosSrc() || null"
      [attr.ios-src]="iosSrc() || null"
      [attr.poster]="poster() || null"
      [attr.alt]="alt()"
      camera-controls
      auto-rotate
      ar
      ar-modes="webxr scene-viewer quick-look"
      touch-action="pan-y"
      shadow-intensity="1"
    ></model-viewer>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    model-viewer {
      width: 100%;
      height: 100%;
      background: transparent;
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Model3dViewerComponent implements OnInit {
  /** `.glb` / `.gltf` scene. */
  readonly src = input<string | undefined>();
  /** `.usdz` for iOS AR Quick Look. */
  readonly iosSrc = input<string | undefined>();
  readonly poster = input<string | undefined>();
  readonly alt = input('');

  async ngOnInit(): Promise<void> {
    await import('@google/model-viewer');
  }
}
