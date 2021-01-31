module.exports = {
  alias: root => {
    return { 
      '~': root,
      'common/': `${root}/src/common/`
     };
  },
  excludes: ['test/index.test.js', '.eslintrc.js', 'rn-cli.config.js']
};
