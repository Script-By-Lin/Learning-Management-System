import { supabase } from '../../core/config/supabase';
import { Role } from '../../shared/constants/roles';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🧹 Starting database clearance (removing sample data)...');

  // List of tables to delete in order to satisfy foreign keys
  const tables = [
    'UserActivityLog',
    'WatchSession',
    'OfflinePayment',
    'AssignmentSubmission',
    'Assignment',
    'QuizSubmission',
    'QuizQuestion',
    'Quiz',
    'Certificate',
    'Enrollment',
    'LessonProgress',
    'Lesson',
    'Module',
    'Course',
    'User'
  ];

  for (const table of tables) {
    console.log(`🧹 Deleting all records from table: ${table}...`);
    // Supabase delete requires a filter; this filters for non-matching dummy uuid to match all rows
    const { error } = await supabase
      .from(table)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.warn(`⚠️ Warning/Error deleting from ${table}: ${error.message}`);
    }
  }

  console.log('👤 Re-creating default users...');
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const instructorPasswordHash = await bcrypt.hash('admin123', 10);
  const studentPasswordHash = await bcrypt.hash('admin123', 10);

  const now = new Date().toISOString();

  const createUser = async (id: string, email: string, fullName: string, passwordHash: string, role: Role, isApproved?: boolean) => {
    const { error } = await supabase.from('User').insert({
      id,
      email,
      fullName,
      passwordHash,
      role,
      isApproved: isApproved ?? (role === Role.INSTRUCTOR ? true : undefined),
      createdAt: now,
      updatedAt: now,
    });

    if (error) {
      throw new Error(`Error creating user ${email}: ${error.message}`);
    }
    console.log(`👤 Created User: ${fullName} (${email})`);
  };

  await createUser(crypto.randomUUID(), 'admin@nexoraacademy.com', 'System Administrator', adminPasswordHash, Role.ADMIN);
  await createUser(crypto.randomUUID(), 'admin@lms.com', 'LMS Admin', adminPasswordHash, Role.ADMIN);
  await createUser(crypto.randomUUID(), 'instructor@nexoraacademy.com', 'Dr. Jane Smith', instructorPasswordHash, Role.INSTRUCTOR, true);
  await createUser(crypto.randomUUID(), 'yanmyoaung@nexoraacademy.com', 'Yan Myo Aung', instructorPasswordHash, Role.INSTRUCTOR, true);
  await createUser(crypto.randomUUID(), 'instructor@lms.com', 'LMS Instructor', instructorPasswordHash, Role.INSTRUCTOR, true);
  await createUser(crypto.randomUUID(), 'student@nexoraacademy.com', 'Alex Vance', studentPasswordHash, Role.STUDENT);
  await createUser(crypto.randomUUID(), 'student@lms.com', 'LMS Student', studentPasswordHash, Role.STUDENT);
  await createUser(crypto.randomUUID(), 'user@lms.com', 'LMS User', studentPasswordHash, Role.STUDENT);

  console.log('✅ Database cleared and reset successfully!');
}

main().catch((e) => {
  console.error('❌ Error during database clearance:', e);
  process.exit(1);
});
