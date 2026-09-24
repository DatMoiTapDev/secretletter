import bcrypt from 'bcryptjs';
import { saveAllLetters, getAllLetters } from './db.js';

async function seedData() {
  const existing = getAllLetters();
  if (existing.length > 0) {
    console.log('Database đã có dữ liệu, bỏ qua bước seed.');
    return;
  }

  console.log('Đang khởi tạo các lá thư mẫu sinh động...');

  const passChristmas = await bcrypt.hash('noel', 10);
  const passTet = await bcrypt.hash('tet', 10);
  const passBirthday = await bcrypt.hash('happy', 10);
  const passMoon = await bcrypt.hash('stars', 10);
  const passCute = await bcrypt.hash('peace', 10);

  const sampleLetters = [
    {
      id: 'noel-2024',
      slug: 'noel-2024',
      recipientName: 'Hà Phương',
      title: 'Giáng Sinh Ấm Áp Dành Cho Em',
      introQuote: 'Có một vài điều mình muốn bạn đọc thật chậm...',
      theme: 'christmas',
      passwordHash: passChristmas,
      hasPassword: true,
      passwordHint: 'Tên ngày lễ đặc biệt này viết liền không dấu (4 chữ cái)',
      music: {
        type: 'preset',
        track: 'holiday_bells', // holiday_bells, dreamy_piano, midnight_lofi, peaceful_acoustic, starry_ambient
        customUrl: '',
        autoplay: true,
        defaultVolume: 0.3
      },
      content: {
        greeting: 'Gửi Hà Phương thương mến,',
        paragraphs: [
          'Mùa đông năm nay có lẽ là mùa đông lạnh nhất mà mình từng trải qua, nhưng cũng là mùa đông đặc biệt nhất vì có sự hiện diện của bạn.',
          'Khi những ánh đèn Noel bắt đầu thắp sáng khắp các góc phố và giai điệu quen thuộc vang lên, điều đầu tiên mình nghĩ đến chính là bạn. Một người luôn mang lại cảm giác bình yên và ấm áp đến lạ kỳ.',
          'Cảm ơn bạn vì đã cùng mình đi qua những ngày bận rộn, cùng sẻ chia những muộn phiền nhỏ nhặt và lắng nghe những câu chuyện chẳng đầu chẳng đuôi.'
        ],
        quotes: [
          {
            tag: '💭 Điều mình muốn nói',
            text: 'Dù ngoài trời tuyết có rơi hay gió đông có lạnh thế nào, mình vẫn mong bạn luôn tìm thấy một góc ấm áp trong tim để mỉm cười.'
          },
          {
            tag: '🌱 Điều mình mong',
            text: 'Mong bạn một mùa Giáng sinh an lành, nhiều tiếng cười và luôn được yêu thương bởi những điều dịu dàng nhất trên thế giới này.'
          }
        ]
      },
      photos: [
        {
          url: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?auto=format&fit=crop&w=800&q=80',
          caption: '📸 Cây thông Noel nhỏ rực rỡ bên ô cửa sổ',
          layout: 'polaroid'
        },
        {
          url: 'https://images.unsplash.com/photo-1543589077-47d81606c1bf?auto=format&fit=crop&w=800&q=80',
          caption: '☕ Tách cacao nóng giữa buổi chiều đông',
          layout: 'polaroid'
        },
        {
          url: 'https://images.unsplash.com/photo-1482517967863-00e15c9b44be?auto=format&fit=crop&w=800&q=80',
          caption: '✨ Một khoảnh khắc bình yên không thể quên',
          layout: 'polaroid'
        }
      ],
      secretUnsaid: {
        enabled: true,
        prompt: '💌 Có một điều mình chưa nói...',
        buttonText: 'Mở phần này',
        content: 'Thực ra, mỗi khi thấy bạn cười, cả ngày mệt mỏi của mình dường như đều tan biến hết. Mình thật sự rất biết ơn vì năm nay có bạn ở cạnh bên.'
      },
      finalThought: {
        enabled: true,
        prompt: 'Còn một điều cuối cùng...',
        content: 'Merry Christmas! Chúc cho mọi điều ước đêm nay của em đều trở thành hiện thực. ❤️🎄'
      },
      createdAt: new Date().toISOString(),
      expiresAt: null,
      openedCount: 0,
      lastOpenedAt: null
    },
    {
      id: 'tet-doan-vien',
      slug: 'tet-doan-vien',
      recipientName: 'Gia Đình Thân Yêu',
      title: 'Xuân Sum Vầy & Tri Ân',
      introQuote: 'Mùa xuân gõ cửa mang theo những lời chúc chân thành nhất...',
      theme: 'tet',
      passwordHash: passTet,
      hasPassword: true,
      passwordHint: 'Chữ cái ngắn gọn báo hiệu năm mới (3 chữ)',
      music: {
        type: 'preset',
        track: 'peaceful_acoustic',
        customUrl: '',
        autoplay: true,
        defaultVolume: 0.3
      },
      content: {
        greeting: 'Kính gửi Bố Mẹ và Cả Nhà,',
        paragraphs: [
          'Một năm nữa lại trôi qua với biết bao thăng trầm và đổi thay. Nhưng dù đi xa đến đâu, khoảnh khắc bước chân về nhà bên mâm cơm tất niên vẫn luôn là điều thiêng liêng nhất.',
          'Nhìn cành đào phai nở rộ trước sân và nồi bánh chưng đỏ lửa, con nhận ra rằng hạnh phúc lớn nhất của đời người đơn giản là khi ngoảnh lại vẫn thấy gia đình bình yên, mạnh khỏe.'
        ],
        quotes: [
          {
            tag: '🧧 Lời chúc đầu xuân',
            text: 'Cầu mong năm mới vạn sự an khang, sức khỏe dồi dào, phúc lộc đầy nhà và mỗi ngày trôi qua đều ngập tràn nụ cười hạnh phúc.'
          }
        ]
      },
      photos: [
        {
          url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
          caption: '🌸 Sắc hoa xuân tươi thắm trong nắng mai',
          layout: 'polaroid'
        },
        {
          url: 'https://images.unsplash.com/photo-1546272989-40c92939c6c2?auto=format&fit=crop&w=800&q=80',
          caption: '🏮 Đèn lồng đỏ và sắc xuân đoàn viên',
          layout: 'polaroid'
        }
      ],
      secretUnsaid: {
        enabled: true,
        prompt: '💌 Có một điều con chưa từng nói thẳng thắn...',
        buttonText: 'Mở bức thư nhỏ này',
        content: 'Con luôn tự hào vì được sinh ra và lớn lên trong tình yêu thương vô điều kiện của gia đình mình. Con yêu bố mẹ rất nhiều!'
      },
      finalThought: {
        enabled: true,
        prompt: 'Còn một điều cuối cùng...',
        content: 'Chúc mừng năm mới! Gia đình ta mãi luôn yêu thương và che chở cho nhau nhé! 🧧✨'
      },
      createdAt: new Date().toISOString(),
      expiresAt: null,
      openedCount: 0,
      lastOpenedAt: null
    },
    {
      id: 'sinh-nhat-minh-anh',
      slug: 'sinh-nhat-minh-anh',
      recipientName: 'Minh Anh',
      title: 'Chúc Mừng Sinh Nhật Tuổi Mới Rực Rỡ',
      introQuote: 'Hôm nay là một ngày đặc biệt của một người vô cùng đặc biệt...',
      theme: 'birthday',
      passwordHash: passBirthday,
      hasPassword: true,
      passwordHint: 'Từ tiếng Anh thể hiện niềm vui (5 chữ cái)',
      music: {
        type: 'preset',
        track: 'dreamy_piano',
        customUrl: '',
        autoplay: true,
        defaultVolume: 0.35
      },
      content: {
        greeting: 'Happy Birthday to Minh Anh! 🎂',
        paragraphs: [
          'Chúc mừng sinh nhật bạn thân mến! Một năm nữa trôi qua, chúc bạn thêm một tuổi mới trưởng thành hơn, kiên cường hơn nhưng vẫn giữ trọn nét hồn nhiên vốn có.',
          'Cảm ơn bạn vì đã luôn là chỗ dựa tinh thần tuyệt vời, một người bạn mà dù có bặt vô âm tín cả tháng thì khi gặp lại vẫn rôm rả như chưa từng cách xa.'
        ],
        quotes: [
          {
            tag: '✨ Ước nguyện tuổi mới',
            text: 'Chúc bạn tuổi mới luôn rực rỡ như hoa, mạnh mẽ như gió và đạt được tất cả những ước mơ bạn đang ấp ủ!'
          }
        ]
      },
      photos: [
        {
          url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80',
          caption: '🎉 Những bóng bay sắc màu mừng tuổi mới',
          layout: 'polaroid'
        },
        {
          url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80',
          caption: '🎂 Ánh nến lung linh và những điều ước nhiệm màu',
          layout: 'polaroid'
        }
      ],
      secretUnsaid: {
        enabled: true,
        prompt: '💌 Có một điều mình chưa nói...',
        buttonText: 'Mở điều bất ngờ',
        content: 'Món quà này tuy giản dị nhưng chứa đựng toàn bộ sự trân trọng mình dành cho bạn. Hãy luôn tin vào chính mình nhé!'
      },
      finalThought: {
        enabled: true,
        prompt: 'Còn một điều cuối cùng...',
        content: 'Sinh nhật vui vẻ nhé người bạn tuyệt vời nhất trần đời! 🥳🎈❤️'
      },
      createdAt: new Date().toISOString(),
      expiresAt: null,
      openedCount: 0,
      lastOpenedAt: null
    },
    {
      id: 'gui-sao-dem',
      slug: 'gui-sao-dem',
      recipientName: 'Người Bạn Tri Kỷ',
      title: 'Những Lời Dưới Bầu Trời Đêm',
      introQuote: 'Có những tâm tư chỉ muốn gửi gắm vào lúc tĩnh lặng nhất...',
      theme: 'emotional',
      passwordHash: passMoon,
      hasPassword: true,
      passwordHint: 'Những đốm sáng lung linh trên bầu trời đêm (tiếng Anh: 5 chữ)',
      music: {
        type: 'preset',
        track: 'starry_ambient',
        customUrl: '',
        autoplay: true,
        defaultVolume: 0.28
      },
      content: {
        greeting: 'Chào bạn, người đang đọc những dòng này trong tĩnh lặng,',
        paragraphs: [
          'Đêm nay bầu trời thật đẹp. Đôi khi giữa guồng quay hối hả của cuộc sống, chúng ta quên mất việc dừng lại để lắng nghe chính mình, lắng nghe tiếng thở của thời gian.',
          'Mình viết những dòng này khi ngoài kia phố đã lên đèn và mọi ồn ào đã lắng xuống. Chỉ muốn nói rằng bạn đã làm rất tốt rồi, dù có những ngày khó khăn đến mức không muốn thức dậy.',
          'Cảm ơn bạn vì đã luôn tử tế với thế giới này, ngay cả khi thế giới có đôi lần không dịu dàng với bạn.'
        ],
        quotes: [
          {
            tag: '🌙 Tâm tình',
            text: 'Dù đêm có tối đến đâu, bầu trời vẫn luôn có những vì sao kiên nhẫn phát sáng. Bạn cũng chính là vì sao như thế trong lòng những người yêu quý bạn.'
          }
        ]
      },
      photos: [
        {
          url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
          caption: '🌌 Bầu trời đêm sâu thẳm đầy hy vọng',
          layout: 'polaroid'
        }
      ],
      secretUnsaid: {
        enabled: true,
        prompt: '💌 Có một điều mình chưa nói...',
        buttonText: 'Mở tâm tư giấu kín',
        content: 'Những lúc bạn thấy chông chênh nhất, hãy nhớ rằng luôn có một người sẵn sàng lắng nghe bạn mà không phán xét bất cứ điều gì.'
      },
      finalThought: {
        enabled: true,
        prompt: 'Còn một điều cuối cùng...',
        content: 'Ngủ thật ngon và thức dậy với một trái tim nhẹ nhõm nhé. Bình yên luôn ở bên bạn. 🌙✨'
      },
      createdAt: new Date().toISOString(),
      expiresAt: null,
      openedCount: 0,
      lastOpenedAt: null
    },
    {
      id: 'ngot-ngao-cho-cau',
      slug: 'ngot-ngao-cho-cau',
      recipientName: 'Bảo Ngọc',
      title: 'Một Chút Ngọt Ngào Dành Cho Cậu',
      introQuote: 'Tặng cậu một chút ngọt ngào để ngày hôm nay tươi vui hơn nhé...',
      theme: 'cute',
      passwordHash: passCute,
      hasPassword: true,
      passwordHint: 'Từ mang nghĩa bình yên trong tiếng Anh (5 chữ)',
      music: {
        type: 'preset',
        track: 'midnight_lofi',
        customUrl: '',
        autoplay: true,
        defaultVolume: 0.3
      },
      content: {
        greeting: 'Gửi cậu,',
        paragraphs: [
          'Hôm nay cậu thế nào rồi? Đã ăn ngon và uống đủ nước chưa?',
          'Chiếc phong bì nhỏ màu hồng pastel này không chứa đựng gì đao to búa lớn cả, chỉ là một chút năng lượng tích cực gom góp lại gửi riêng cho cậu thôi nè!'
        ],
        quotes: [
          {
            tag: '💕 Điều dễ thương',
            text: 'Mỗi ngày hãy tự thưởng cho mình một viên kẹo ngọt hoặc một bản nhạc thật hay, vì cậu xứng đáng được đối xử thật êm ái.'
          }
        ]
      },
      photos: [
        {
          url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=800&q=80',
          caption: '🌸 Một bông hoa nhỏ cho ngày thêm rạng rỡ',
          layout: 'polaroid'
        }
      ],
      secretUnsaid: {
        enabled: true,
        prompt: '💌 Cậu có tò mò không?',
        buttonText: 'Xem điều bí mật',
        content: 'Cậu là một người rất dễ mến và có nụ cười tỏa nắng. Hãy cười nhiều hơn nhé!'
      },
      finalThought: {
        enabled: true,
        prompt: 'Còn một điều cuối cùng...',
        content: 'Chúc cậu một ngày siêu siêu ngọt ngào và may mắn ngập tràn! 💕✨'
      },
      createdAt: new Date().toISOString(),
      expiresAt: null,
      openedCount: 0,
      lastOpenedAt: null
    }
  ];

  saveAllLetters(sampleLetters);
  console.log(`Đã tạo thành công ${sampleLetters.length} lá thư mẫu!`);
}

seedData();
