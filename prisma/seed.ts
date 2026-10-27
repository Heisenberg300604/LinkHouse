import { seedDemo } from '../lib/repository';
import { db } from '../lib/db';
seedDemo().finally(() => db.$disconnect());
