import { supabase } from '../../core/config/supabase';
import { Role } from '../../shared/constants/roles';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Starting database seeding via Supabase...');

  // Hash passwords
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const instructorPasswordHash = await bcrypt.hash('admin123', 10);
  const studentPasswordHash = await bcrypt.hash('admin123', 10);

  const now = new Date().toISOString();

  // Helper function to check and create user
  const upsertUser = async (email: string, fullName: string, passwordHash: string, role: Role) => {
    const { data: existingUser, error: findError } = await supabase
      .from('User')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (findError) {
      throw new Error(`Error checking user: ${findError.message}`);
    }

    if (existingUser) {
      console.log(`👤 User already exists: ${existingUser.fullName} (${existingUser.email})`);
      return existingUser;
    }

    const id = crypto.randomUUID();
    const { data: newUser, error: insertError } = await supabase
      .from('User')
      .insert({
        id,
        email,
        fullName,
        passwordHash,
        role,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Error creating user: ${insertError.message}`);
    }

    console.log(`👤 Created User: ${newUser.fullName} (${newUser.email})`);
    return newUser;
  };

  // 1. Create Admin
  const admin = await upsertUser('admin@aegisacademy.com', 'System Administrator', adminPasswordHash, Role.ADMIN);
  const lmsAdmin = await upsertUser('admin@lms.com', 'LMS Admin', adminPasswordHash, Role.ADMIN);

  // 2. Create Instructors
  const instructor1 = await upsertUser('instructor@aegisacademy.com', 'Dr. Jane Smith', instructorPasswordHash, Role.INSTRUCTOR);
  const instructor2 = await upsertUser('yanmyoaung@aegisacademy.com', 'Yan Myo Aung', instructorPasswordHash, Role.INSTRUCTOR);
  const lmsInstructor = await upsertUser('instructor@lms.com', 'LMS Instructor', instructorPasswordHash, Role.INSTRUCTOR);

  // 3. Create Students
  const student = await upsertUser('student@aegisacademy.com', 'Alex Vance', studentPasswordHash, Role.STUDENT);
  const lmsStudent = await upsertUser('student@lms.com', 'LMS Student', studentPasswordHash, Role.STUDENT);
  const lmsUser = await upsertUser('user@lms.com', 'LMS User', studentPasswordHash, Role.STUDENT);

  // 4. Define courses to seed
  const coursesToSeed = [
    {
      title: 'Odoo Development',
      category: 'Odoo Development',
      description: 'Learn the fundamentals of Odoo ERP development. Build custom modules, work with models, views, and controllers, and integrate with PostgreSQL database.',
      instructorId: instructor2.id,
      modules: [
        { title: 'Introduction to Odoo & ERP Systems', order: 1, lessons: [{ title: 'Odoo Ecosystem & Architecture', type: 'VIDEO' }, { title: 'Setting up the Development Environment', type: 'VIDEO' }] },
        { title: 'Odoo Models and Fields', order: 2, lessons: [{ title: 'Defining custom models', type: 'VIDEO' }, { title: 'Relational Fields (Many2one, One2many)', type: 'TEXT' }] }
      ]
    },
    {
      title: 'A+',
      category: 'A+',
      description: 'This course provides foundational knowledge of computer hardware, software, operating systems, and basic IT troubleshooting. Learners will understand how computers work, how to assemble and maintain systems, install and manage software, and diagnose common technical issues. It is designed for beginners preparing for entry-level IT roles and certifications.',
      instructorId: instructor2.id,
      modules: [
        { title: 'Hardware Essentials', order: 1, lessons: [{ title: 'Understanding Motherboards and CPUs', type: 'VIDEO' }, { title: 'RAM Types and Storage Devices', type: 'VIDEO' }] },
        { title: 'Operating Systems & Troubleshooting', order: 2, lessons: [{ title: 'Installing Windows and Linux', type: 'TEXT' }, { title: 'Basic BIOS/UEFI Configuration', type: 'VIDEO' }] }
      ],
      quiz: {
        title: 'Hardware Basics Quiz',
        description: 'Verify your understanding of motherboards, CPUs, and volatile memory.',
        questions: [
          { questionText: 'What does CPU stand for?', options: ['Central Processing Unit', 'Computer Personal Unit', 'Central Power Utility', 'Control Processing Unit'], correctOptionIndex: 0 },
          { questionText: 'Which memory type is volatile and cleared on power loss?', options: ['ROM', 'RAM', 'SSD', 'HDD'], correctOptionIndex: 1 }
        ]
      },
      assignment: {
        title: 'PC Assembly Simulation Report',
        description: 'Submit a report describing the step-by-step assembly of a standard desktop computer, including necessary safety precautions.',
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days out
      }
    },
    {
      title: 'Linux System Administration',
      category: 'Linux System Administration',
      description: 'Master Linux system administration. Learn command line, user management, file permissions, network configuration, shell scripting, and package management.',
      instructorId: instructor2.id,
      modules: [
        { title: 'Getting Started with Linux', order: 1, lessons: [{ title: 'The Linux Command Line Interface', type: 'VIDEO' }, { title: 'Basic Commands (ls, cd, mkdir, cp)', type: 'VIDEO' }] }
      ]
    },
    {
      title: 'Computer Science',
      category: 'Computer Science',
      description: 'A comprehensive introduction to computer science. Master algorithms, data structures, computation theory, and software development foundations using modern languages.',
      instructorId: instructor1.id,
      modules: [
        { title: 'Introduction to Algorithms', order: 1, lessons: [{ title: 'What is an Algorithm?', type: 'VIDEO' }, { title: 'Binary Search & Big O Notation', type: 'VIDEO' }] }
      ]
    },
    {
      title: 'Front-End Web Development',
      category: 'Front-End Web Development',
      description: 'Master modern HTML5, CSS3, JavaScript, and Tailwind CSS. Learn to build responsive, interactive layouts and deploy high-performance user interfaces.',
      instructorId: instructor1.id,
      modules: [
        { title: 'HTML5 & CSS3 Fundamentals', order: 1, lessons: [{ title: 'Semantic HTML markup', type: 'VIDEO' }, { title: 'CSS Flexbox and Grid layout systems', type: 'VIDEO' }] }
      ]
    },
    {
      title: 'C++ Programming',
      category: 'C++ Programming',
      description: 'Learn C++ programming from scratch. Understand object-oriented programming, memory management, pointers, and high-performance algorithms.',
      instructorId: instructor1.id,
      modules: [
        { title: 'C++ Basics', order: 1, lessons: [{ title: 'Variables, loops, and control flow', type: 'VIDEO' }, { title: 'Pointers and Memory Allocation', type: 'VIDEO' }] }
      ]
    },
    {
      title: 'Git and GitHub',
      category: 'Git and GitHub',
      description: 'Master version control with Git. Learn branching, merging, pull requests, collaborative workflows, and GitHub Actions CI/CD pipelines.',
      instructorId: instructor1.id,
      modules: [
        { title: 'Version Control with Git', order: 1, lessons: [{ title: 'Git init, add, and commit', type: 'VIDEO' }, { title: 'Understanding branches and merging', type: 'VIDEO' }] }
      ]
    },
    {
      title: 'Network Engineering ( NE )',
      category: 'Network Engineering ( NE )',
      description: 'Master routing, switching, subnetting, TCP/IP, and firewall configuration. Learn Cisco CCNA concepts and prepare for professional networking roles.',
      instructorId: instructor2.id,
      modules: [
        { title: 'Networking Fundamentals', order: 1, lessons: [{ title: 'The OSI Model & TCP/IP Protocol Suite', type: 'VIDEO' }, { title: 'Understanding Subnetting & IP addressing', type: 'VIDEO' }] }
      ]
    }
  ];

  // 5. Seed Courses
  for (const item of coursesToSeed) {
    // Check if course already exists
    const { data: existing, error: checkErr } = await supabase
      .from('Course')
      .select('*')
      .eq('title', item.title)
      .maybeSingle();

    if (checkErr) throw new Error(`Check course error: ${checkErr.message}`);

    let activeCourse: any;
    if (existing) {
      console.log(`📚 Course already exists: "${item.title}"`);
      activeCourse = existing;
    } else {
      const cId = crypto.randomUUID();
      const { data: newCourse, error: insertErr } = await supabase
        .from('Course')
        .insert({
          id: cId,
          title: item.title,
          description: item.description,
          category: item.category,
          instructorId: item.instructorId,
          createdAt: now,
          updatedAt: now,
        })
        .select()
        .single();

      if (insertErr) throw new Error(`Insert course error: ${insertErr.message}`);
      console.log(`📚 Created Course: "${item.title}"`);
      activeCourse = newCourse;
    }

    // Seed Modules & Lessons
    for (const m of item.modules) {
      // Check if module already exists for this course
      const { data: existingMod, error: checkModErr } = await supabase
        .from('Module')
        .select('*')
        .eq('courseId', activeCourse.id)
        .eq('title', m.title)
        .maybeSingle();

      if (checkModErr) throw new Error(`Check module error: ${checkModErr.message}`);

      let activeModule: any;
      if (existingMod) {
        activeModule = existingMod;
      } else {
        const mId = crypto.randomUUID();
        const { data: newMod, error: insertModErr } = await supabase
          .from('Module')
          .insert({
            id: mId,
            courseId: activeCourse.id,
            title: m.title,
            order: m.order,
            createdAt: now,
            updatedAt: now,
          })
          .select()
          .single();

        if (insertModErr) throw new Error(`Insert module error: ${insertModErr.message}`);
        activeModule = newMod;

        // Seed lessons inside the module
        let lOrder = 1;
        for (const l of m.lessons) {
          const lId = crypto.randomUUID();
          const { error: insertLessErr } = await supabase
            .from('Lesson')
            .insert({
              id: lId,
              moduleId: activeModule.id,
              title: l.title,
              type: l.type,
              order: lOrder++,
              content: l.type === 'DOCUMENT' ? 'This is seeded textbook study material.' : 'This is a sample video lesson placeholder.',
              videoUrl: l.type === 'VIDEO' ? 'https://www.w3schools.com/html/mov_bbb.mp4' : null,
              createdAt: now,
              updatedAt: now,
            });

          if (insertLessErr) throw new Error(`Insert lesson error: ${insertLessErr.message}`);
        }
      }
    }

    // Seed Quiz if defined
    if ('quiz' in item && item.quiz) {
      const { data: existingQuiz } = await supabase
        .from('Quiz')
        .select('*')
        .eq('courseId', activeCourse.id)
        .eq('title', item.quiz.title)
        .maybeSingle();

      if (!existingQuiz) {
        const qId = crypto.randomUUID();
        const { data: newQuiz, error: qErr } = await supabase
          .from('Quiz')
          .insert({
            id: qId,
            courseId: activeCourse.id,
            title: item.quiz.title,
            description: item.quiz.description,
            createdAt: now,
            updatedAt: now,
          })
          .select()
          .single();

        if (qErr) throw new Error(`Insert quiz error: ${qErr.message}`);

        // Seed Quiz Questions
        for (const question of item.quiz.questions) {
          const qstId = crypto.randomUUID();
          const { error: qstErr } = await supabase
            .from('QuizQuestion')
            .insert({
              id: qstId,
              quizId: newQuiz.id,
              questionText: question.questionText,
              options: question.options,
              correctOptionIndex: question.correctOptionIndex,
              createdAt: now,
              updatedAt: now,
            });

          if (qstErr) throw new Error(`Insert question error: ${qstErr.message}`);
        }
        console.log(`✏️ Created Quiz: "${item.quiz.title}"`);
      }
    }

    // Seed Assignment if defined
    if ('assignment' in item && item.assignment) {
      const { data: existingAssignment } = await supabase
        .from('Assignment')
        .select('*')
        .eq('courseId', activeCourse.id)
        .eq('title', item.assignment.title)
        .maybeSingle();

      if (!existingAssignment) {
        const aId = crypto.randomUUID();
        const { error: assErr } = await supabase
          .from('Assignment')
          .insert({
            id: aId,
            courseId: activeCourse.id,
            title: item.assignment.title,
            description: item.assignment.description,
            dueDate: item.assignment.dueDate,
            createdAt: now,
            updatedAt: now,
          });

        if (assErr) throw new Error(`Insert assignment error: ${assErr.message}`);
        console.log(`✍️ Created Assignment: "${item.assignment.title}"`);
      }
    }

    // Auto enroll student in Odoo and A+ courses
    if (item.title === 'Odoo Development' || item.title === 'A+') {
      const studentsToEnroll = [student, lmsStudent, lmsUser];
      for (const currentStudent of studentsToEnroll) {
        const { data: existingEnrollment } = await supabase
          .from('Enrollment')
          .select('*')
          .eq('userId', currentStudent.id)
          .eq('courseId', activeCourse.id)
          .maybeSingle();

        if (!existingEnrollment) {
          const enrollId = crypto.randomUUID();
          await supabase
            .from('Enrollment')
            .insert({
              id: enrollId,
              userId: currentStudent.id,
              courseId: activeCourse.id,
              joinedAt: now,
              completed: false,
              createdAt: now,
              updatedAt: now,
            });
          console.log(`🎓 Enrolled Student ${currentStudent.fullName} in "${item.title}"`);
        }
      }
    }
  }

  console.log('✅ Seeding completed successfully!');
}

main().catch((e) => {
  console.error('❌ Error during seeding:', e);
  process.exit(1);
});

