// regular static imports for local code
import Heading from './heading/heading.js';
import jQueryTest from './jquery-test/jquery-test';

const heading = new Heading();
heading.render('HOST (Module Federation)');

jQueryTest();
