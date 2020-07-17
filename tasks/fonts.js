import gulp from 'gulp';
import gulpif from 'gulp-if';
import livereload from 'gulp-livereload';
import args from './lib/args';
import './glyphicons'

gulp.task('fonts', gulp.series('glyphicons', () => {
  return gulp.src('app/fonts/**/*.{woff,woff2,ttf,eot,svg}')
    .pipe(gulp.dest(`dist/${args.vendor}/fonts`))
    .pipe(gulpif(args.watch, livereload()));
}));
