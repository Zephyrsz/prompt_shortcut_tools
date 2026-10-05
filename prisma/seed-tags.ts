import { prisma } from '../src/lib/prisma';

const defaultTags = [
  { name: '写作辅助', color: 'bg-yellow-500' },
  { name: 'AI', color: 'bg-orange-500' },
  { name: 'SEO', color: 'bg-yellow-500' },
  { name: 'IT/编程', color: 'bg-orange-500' },
  { name: '语言/翻译', color: 'bg-gray-600' },
  { name: '心理/社交', color: 'bg-red-500' },
  { name: '金融顾问', color: 'bg-teal-500' },
  { name: '学术/老师', color: 'bg-orange-500' },
  { name: '音乐', color: 'bg-teal-500' },
  { name: '游戏', color: 'bg-gray-600' },
  { name: '医生', color: 'bg-gray-600' },
  { name: '辩论/演讲', color: 'bg-red-500' },
  { name: '行业顾问', color: 'bg-yellow-500' },
  { name: '终端/解释器', color: 'bg-orange-500' },
  { name: '自助百科', color: 'bg-purple-500' },
  { name: '生活质量', color: 'bg-purple-500' },
  { name: '趣味知识', color: 'bg-teal-500' },
  { name: '企业职位', color: 'bg-gray-600' },
];

async function main() {
  console.log('Seeding tags...');

  for (const tag of defaultTags) {
    try {
      await prisma.tag.upsert({
        where: { name: tag.name },
        update: { color: tag.color },
        create: tag,
      });
      console.log(`✓ Tag "${tag.name}" seeded`);
    } catch (error) {
      console.error(`✗ Error seeding tag "${tag.name}":`, error);
    }
  }

  console.log('Tag seeding completed!');
  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  });
