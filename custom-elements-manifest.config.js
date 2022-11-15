import { jsdocExamplePlugin } from 'cem-plugin-jsdoc-example';

export default {
  /** Globs to analyze */
  globs: ['src/**/*.ts'],
  /** Enable special handling for litelement */
  litelement: true,
  /** Provide custom plugins */
  plugins: [
    jsdocExamplePlugin(),
  ]
}
