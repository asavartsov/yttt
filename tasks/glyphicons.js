import gulp from 'gulp';
import gulpif from 'gulp-if';
import livereload from 'gulp-livereload';
import args from './lib/args';

gulp.task('glyphicons', () => {
  return gulp.src('node_modules/bootstrap/fonts/**/*.{woff,woff2,ttf,eot,svg}')
    .pipe(gulp.dest(`app/fonts`));
});
