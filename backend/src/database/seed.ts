import bcrypt from 'bcryptjs';
import { getDatabase } from '../config/database';
import { UserRole } from '../../shared/types';

const database = getDatabase();

async function seedDatabase(): Promise<void> {
  try {
    console.log('🌱 Starting database seeding...');

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 12);
    const userPassword = await bcrypt.hash('user123', 12);
    const testPassword = await bcrypt.hash('test123', 12);

    // Create admin user
    const adminResult = await database.query(`
      INSERT INTO users (email, username, display_name, password_hash, bio, is_verified, role, email_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `, [
      'admin@halo.com',
      'admin',
      'HALO Admin',
      adminPassword,
      'System administrator for HALO platform',
      true,
      UserRole.ADMIN,
      true
    ]);

    // Create test user
    const userResult = await database.query(`
      INSERT INTO users (email, username, display_name, password_hash, bio, is_verified, role, email_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `, [
      'user@halo.com',
      'user',
      'Test User',
      userPassword,
      'A test user for demonstration purposes',
      true,
      UserRole.USER,
      true
    ]);

    // Create additional test users
    const testUsers = [
      {
        email: 'john@halo.com',
        username: 'john_doe',
        displayName: 'John Doe',
        bio: 'Software developer and tech enthusiast',
        password: testPassword
      },
      {
        email: 'jane@halo.com',
        username: 'jane_smith',
        displayName: 'Jane Smith',
        bio: 'Digital artist and creative designer',
        password: testPassword
      },
      {
        email: 'mike@halo.com',
        username: 'mike_wilson',
        displayName: 'Mike Wilson',
        bio: 'Travel blogger and adventure seeker',
        password: testPassword
      },
      {
        email: 'sarah@halo.com',
        username: 'sarah_jones',
        displayName: 'Sarah Jones',
        bio: 'Fitness trainer and wellness coach',
        password: testPassword
      }
    ];

    const userIds: string[] = [];

    for (const user of testUsers) {
      const result = await database.query(`
        INSERT INTO users (email, username, display_name, password_hash, bio, is_verified, role, email_verified)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (email) DO NOTHING
        RETURNING id
      `, [
        user.email,
        user.username,
        user.displayName,
        user.password,
        user.bio,
        true,
        UserRole.USER,
        true
      ]);

      if (result.rows.length > 0) {
        userIds.push(result.rows[0].id);
      }
    }

    // Get all user IDs for creating relationships
    const allUsersResult = await database.query('SELECT id FROM users WHERE role = $1', [UserRole.USER]);
    const allUserIds = allUsersResult.rows.map(row => row.id);

    // Create follow relationships
    console.log('👥 Creating follow relationships...');
    for (let i = 0; i < allUserIds.length; i++) {
      for (let j = 0; j < allUserIds.length; j++) {
        if (i !== j && Math.random() > 0.5) {
          await database.query(`
            INSERT INTO follows (follower_id, followed_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
          `, [allUserIds[i], allUserIds[j]]);
        }
      }
    }

    // Create sample posts
    console.log('📝 Creating sample posts...');
    const samplePosts = [
      {
        content: 'Just launched HALO - the next generation social media platform! 🚀 #HALO #SocialMedia #Innovation',
        hashtags: ['HALO', 'SocialMedia', 'Innovation']
      },
      {
        content: 'Beautiful sunset today! Nature never fails to amaze me. 🌅 #Nature #Sunset #Photography',
        hashtags: ['Nature', 'Sunset', 'Photography']
      },
      {
        content: 'Working on some exciting new features for HALO. Can\'t wait to share them with you all! 💻 #Coding #Development #HALO',
        hashtags: ['Coding', 'Development', 'HALO']
      },
      {
        content: 'Coffee and code - the perfect combination for a productive day! ☕️ #Coffee #Coding #Productivity',
        hashtags: ['Coffee', 'Coding', 'Productivity']
      },
      {
        content: 'Just finished reading an amazing book about AI and the future of technology. Mind-blowing stuff! 📚 #AI #Technology #Books',
        hashtags: ['AI', 'Technology', 'Books']
      },
      {
        content: 'Weekend vibes! Time to relax and recharge. What are your plans? 😊 #Weekend #Relaxation #Life',
        hashtags: ['Weekend', 'Relaxation', 'Life']
      },
      {
        content: 'The HALO community is growing so fast! Thank you all for your support and feedback. 🙏 #Community #Gratitude #HALO',
        hashtags: ['Community', 'Gratitude', 'HALO']
      },
      {
        content: 'New workout routine is paying off! Feeling stronger and more energized every day. 💪 #Fitness #Health #Motivation',
        hashtags: ['Fitness', 'Health', 'Motivation']
      }
    ];

    for (const post of samplePosts) {
      const randomUserId = allUserIds[Math.floor(Math.random() * allUserIds.length)];
      
      const postResult = await database.query(`
        INSERT INTO posts (content, author_id)
        VALUES ($1, $2)
        RETURNING id
      `, [post.content, randomUserId]);

      const postId = postResult.rows[0].id;

      // Create hashtags and link them to posts
      for (const hashtagName of post.hashtags) {
        // Insert hashtag
        const hashtagResult = await database.query(`
          INSERT INTO hashtags (name)
          VALUES ($1)
          ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
          RETURNING id
        `, [hashtagName]);

        const hashtagId = hashtagResult.rows[0].id;

        // Link hashtag to post
        await database.query(`
          INSERT INTO post_hashtags (post_id, hashtag_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `, [postId, hashtagId]);
      }
    }

    // Create sample comments
    console.log('💬 Creating sample comments...');
    const postsResult = await database.query('SELECT id FROM posts LIMIT 5');
    const postIds = postsResult.rows.map(row => row.id);

    const sampleComments = [
      'This is amazing! Great work! 👏',
      'I love this! Thanks for sharing! ❤️',
      'This is exactly what I needed to see today! 😊',
      'Incredible! Can\'t wait to see more! 🚀',
      'This is so inspiring! Thank you! 🙏',
      'Love the energy here! Keep it up! 💪',
      'This made my day! 🌟',
      'Absolutely fantastic! 🔥'
    ];

    for (const postId of postIds) {
      const numComments = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numComments; i++) {
        const randomUserId = allUserIds[Math.floor(Math.random() * allUserIds.length)];
        const randomComment = sampleComments[Math.floor(Math.random() * sampleComments.length)];

        await database.query(`
          INSERT INTO comments (content, author_id, post_id)
          VALUES ($1, $2, $3)
        `, [randomComment, randomUserId, postId]);
      }
    }

    // Create sample likes
    console.log('❤️ Creating sample likes...');
    for (const postId of postIds) {
      const numLikes = Math.floor(Math.random() * 5) + 1;
      const shuffledUsers = [...allUserIds].sort(() => 0.5 - Math.random());
      
      for (let i = 0; i < Math.min(numLikes, shuffledUsers.length); i++) {
        await database.query(`
          INSERT INTO likes (user_id, post_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `, [shuffledUsers[i], postId]);
      }
    }

    // Create sample conversations
    console.log('💬 Creating sample conversations...');
    const conversationResult = await database.query(`
      INSERT INTO conversations (is_group, name)
      VALUES (false, null)
      RETURNING id
    `);
    const conversationId = conversationResult.rows[0].id;

    // Add participants to conversation
    await database.query(`
      INSERT INTO conversation_participants (conversation_id, user_id)
      VALUES ($1, $2), ($1, $3)
    `, [conversationId, allUserIds[0], allUserIds[1]]);

    // Create sample messages
    const sampleMessages = [
      'Hey! How are you doing?',
      'I\'m doing great! How about you?',
      'Pretty good! Just working on some new features for HALO.',
      'That sounds exciting! Can\'t wait to see what you\'re building.',
      'Thanks! I\'ll definitely share updates soon.',
      'Looking forward to it! 😊'
    ];

    for (let i = 0; i < sampleMessages.length; i++) {
      const senderId = i % 2 === 0 ? allUserIds[0] : allUserIds[1];
      await database.query(`
        INSERT INTO messages (content, sender_id, conversation_id)
        VALUES ($1, $2, $3)
      `, [sampleMessages[i], senderId, conversationId]);
    }

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📋 Default accounts created:');
    console.log('👑 Admin: admin@halo.com / admin123');
    console.log('👤 User: user@halo.com / user123');
    console.log('👥 Test users: john@halo.com, jane@halo.com, mike@halo.com, sarah@halo.com / test123');

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Seeding script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding script failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };