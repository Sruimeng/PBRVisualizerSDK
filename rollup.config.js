import pkg from './package.json';
import { getPlugins } from './scripts/rollup-config-helper';

const banner = `/*!
 * Name: ${pkg.name}
 * Description: ${pkg.description}
 * Author: ${pkg.author}
 * Contributors: ${pkg.contributors.map((c) => c.name).join(',')}
 * Version: v${pkg.version}
 */
`;

const plugins = getPlugins(pkg);

export default () => {
  return [
    {
      input: 'src/index.ts',
      output: {
        file: pkg.module,
        format: 'es',
        banner,
        sourcemap: false,
      },
      plugins,
      external: (id) => {
        if (!id) return false;
        return (
          id === 'three' ||
          id === 'postprocessing' ||
          id === 'react' ||
          id === 'react-dom' ||
          id.includes('react/jsx-runtime') ||
          id.startsWith('three/') ||
          id.includes('three/addons') ||
          id.includes('three/examples/jsm')
        );
      },
    },
  ];
};
