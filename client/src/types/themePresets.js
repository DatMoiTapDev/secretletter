/**
 * Dữ liệu mẫu hoàn chỉnh cho tất cả 8 Vibe Chủ Đề
 * Dùng cho Trang Tổng Hợp Vibe Hub tương tác 1 trang duy nhất
 */
export const VIBE_DATA = {
  christmas: {
    id: 'christmas',
    theme: 'christmas',
    recipientName: 'Hà Phương',
    title: 'Giáng Sinh Ấm Áp Dành Cho Em',
    introQuote: 'Có một vài điều mình muốn bạn đọc thật chậm...',
    password: 'noel',
    passwordHint: 'Tên ngày lễ này viết liền không dấu (4 chữ cái)',
    music: { type: 'preset', track: 'holiday_bells', defaultVolume: 0.3 },
    content: {
      greeting: 'Gửi Hà Phương thương mến,',
      paragraphs: [
        'Mùa đông năm nay có lẽ là mùa đông đặc biệt nhất vì có sự hiện diện của bạn.',
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
          text: 'Mong bạn một mùa Giáng sinh an lành, nhiều tiếng cười và luôn được yêu thương bởi những điều dịu dàng nhất.'
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
      }
    ],
    secretUnsaid: {
      enabled: true,
      prompt: '💌 Có một điều mình chưa nói...',
      buttonText: 'Mở phần này',
      content: 'Mỗi khi thấy bạn cười, cả ngày mệt mỏi của mình dường như đều tan biến hết. Cảm ơn vì năm nay có bạn ở cạnh bên.'
    },
    finalThought: {
      enabled: true,
      prompt: 'Còn một điều cuối cùng...',
      content: 'Merry Christmas! Chúc cho mọi điều ước đêm nay của em đều trở thành hiện thực. ❤️🎄'
    }
  },

  tet: {
    id: 'tet',
    theme: 'tet',
    recipientName: 'Gia Đình Thân Yêu',
    title: 'Xuân Sum Vầy & Tri Ân',
    introQuote: 'Mùa xuân gõ cửa mang theo những lời chúc chân thành nhất...',
    password: 'tet',
    passwordHint: 'Tên ngày lễ lớn nhất đầu năm của người Việt (3 chữ)',
    music: { type: 'preset', track: 'peaceful_acoustic', defaultVolume: 0.3 },
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
    }
  },

  birthday: {
    id: 'birthday',
    theme: 'birthday',
    recipientName: 'Minh Anh',
    title: 'Chúc Mừng Sinh Nhật Tuổi Mới Rực Rỡ',
    introQuote: 'Hôm nay là một ngày đặc biệt của một người vô cùng đặc biệt...',
    password: 'happy',
    passwordHint: 'Từ tiếng Anh thể hiện niềm vui (5 chữ cái)',
    music: { type: 'preset', track: 'dreamy_piano', defaultVolume: 0.35 },
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
    }
  },

  emotional: {
    id: 'emotional',
    theme: 'emotional',
    recipientName: 'Người Bạn Tri Kỷ',
    title: 'Những Lời Dưới Bầu Trời Đêm',
    introQuote: 'Có những tâm tư chỉ muốn gửi gắm vào lúc tĩnh lặng nhất...',
    password: 'stars',
    passwordHint: 'Những đốm sáng lung linh trên bầu trời đêm (5 chữ)',
    music: { type: 'preset', track: 'starry_ambient', defaultVolume: 0.28 },
    content: {
      greeting: 'Chào bạn, người đang đọc những dòng này trong tĩnh lặng,',
      paragraphs: [
        'Đêm nay bầu trời thật đẹp. Giữa guồng quay hối hả của cuộc sống, chúng ta thường quên mất việc dừng lại để lắng nghe chính mình.',
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
    }
  },

  cute: {
    id: 'cute',
    theme: 'cute',
    recipientName: 'Bảo Ngọc',
    title: 'Một Chút Ngọt Ngào Dành Cho Cậu',
    introQuote: 'Tặng cậu một chút ngọt ngào để ngày hôm nay tươi vui hơn nhé...',
    password: 'peace',
    passwordHint: 'Từ mang nghĩa bình yên trong tiếng Anh (5 chữ)',
    music: { type: 'preset', track: 'midnight_lofi', defaultVolume: 0.3 },
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
      content: 'Cậu là một người rất dễ mến và có nụ cười tỏa nắng. Hãy cười nhiều hơn mỗi ngày nhé!'
    },
    finalThought: {
      enabled: true,
      prompt: 'Còn một điều cuối cùng...',
      content: 'Chúc cậu một ngày siêu siêu ngọt ngào và may mắn ngập tràn! 💕✨'
    }
  },

  funny: {
    id: 'funny',
    theme: 'funny',
    recipientName: 'Đồng Chí Hài Hước',
    title: 'Cảnh Báo: Bức Thư Chứa 100% Năng Lượng Vui Vẻ',
    introQuote: 'Không đọc là tiếc ráng chịu nha, mở ra cười liền...',
    password: 'cuoi',
    passwordHint: 'Hành động mở miệng tạo tiếng vui vẻ (4 chữ cái)',
    music: { type: 'preset', track: 'dreamy_piano', defaultVolume: 0.3 },
    content: {
      greeting: 'Hế lô đồng chí,',
      paragraphs: [
        'Hôm nay lướt qua thấy bạn có vẻ đang làm việc chăm chỉ quá mức quy định, nên mình phải gửi ngay chiếc thư này để giải cứu bạn khỏi sự nghiêm túc!',
        'Cuộc đời ngắn lắm, nên hãy cười khi còn đủ răng và vui vẻ bất cứ lúc nào có thể nhé haha.'
      ],
      quotes: [
        {
          tag: '😂 Chân lý cuộc sống',
          text: 'Muộn phiền thì vứt ra sau, niềm vui gom lại để dành cùng nhau!'
        }
      ]
    },
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80',
        caption: '🥳 Một ngày vui bung nóc cùng đồng đội',
        layout: 'polaroid'
      }
    ],
    secretUnsaid: {
      enabled: true,
      prompt: '💌 Có một bí mật kinh hoàng...',
      buttonText: 'Dám bấm không?',
      content: 'Thật ra bạn là người hài hước và dễ thương nhất nhóm rồi, đừng khiêm tốn nữa!'
    },
    finalThought: {
      enabled: true,
      prompt: 'Còn một điều cuối cùng...',
      content: 'Chúc bạn một ngày quẩy hết mình, không lo drama! 🥳🎉💛'
    }
  },

  elegant: {
    id: 'elegant',
    theme: 'elegant',
    recipientName: 'Quý Bạn Trân Quý',
    title: 'Tấm Thiệp Tri Ân & Phong Thái Hoàng Gia',
    introQuote: 'Gửi đến bạn những trân trọng và tao nhã nhất của thời gian...',
    password: 'vang',
    passwordHint: 'Kim loại quý màu sắc lấp lánh (4 chữ cái)',
    music: { type: 'preset', track: 'peaceful_acoustic', defaultVolume: 0.3 },
    content: {
      greeting: 'Kính gửi Bạn,',
      paragraphs: [
        'Có những giá trị không bao giờ phai nhạt theo thời gian, đó là sự tử tế, phong thái đĩnh đạc và chân thành trong từng mối giao hảo.',
        'Bức thư này được gửi đi với lòng biết ơn sâu sắc về sự đồng hành và thấu hiểu của bạn trong suốt chặng đường đã qua.'
      ],
      quotes: [
        {
          tag: '🌸 Triết lý thanh lịch',
          text: 'Sự tao nhã không nằm ở việc gây chú ý, mà ở việc được ghi nhớ mãi trong lòng người khác.'
        }
      ]
    },
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
        caption: '⚜️ Sự tao nhã và thanh tao của thời gian',
        layout: 'polaroid'
      }
    ],
    secretUnsaid: {
      enabled: true,
      prompt: '💌 Lời tri ân sâu kín...',
      buttonText: 'Mở bức thư nhung lụa',
      content: 'Cảm ơn bạn đã luôn giữ vững khí chất và truyền cảm hứng sống đẹp cho những người xung quanh.'
    },
    finalThought: {
      enabled: true,
      prompt: 'Còn một điều cuối cùng...',
      content: 'Kính chúc bạn một đời phong lưu, an khang và luôn rực rỡ phong thái! ⚜️✨'
    }
  },

  minimal: {
    id: 'minimal',
    theme: 'minimal',
    recipientName: 'Một Người Bạn',
    title: 'Một Thoáng Tĩnh Lặng',
    introQuote: 'Không cầu kỳ, chỉ là những dòng chữ mộc mạc gửi bạn...',
    password: 'yen',
    passwordHint: 'Từ đồng nghĩa với tĩnh lặng, không ồn ào (3 chữ cái)',
    music: { type: 'preset', track: 'starry_ambient', defaultVolume: 0.25 },
    content: {
      greeting: 'Gửi bạn,',
      paragraphs: [
        'Đôi khi, điều giá trị nhất lại không cần bất kỳ lớp vỏ trang trí nào.',
        'Chỉ là những con chữ mộc mạc, một khoảng không gian đen trắng để bạn tạm gác lại những xáo trộn bên ngoài và đối thoại với chính mình.'
      ],
      quotes: [
        {
          tag: '🖤 Suy tưởng',
          text: 'Càng tối giản, con người ta càng nhận ra điều gì mới thực sự quan trọng trong cuộc đời.'
        }
      ]
    },
    photos: [],
    secretUnsaid: {
      enabled: true,
      prompt: '💌 Dòng tin ngắn...',
      buttonText: 'Xem tiếp',
      content: 'Dù ở đâu, hãy luôn sống thật với chính cảm xúc của mình nhé.'
    },
    finalThought: {
      enabled: true,
      prompt: 'Còn một điều cuối cùng...',
      content: 'Bình an từ sâu thẳm tâm hồn. 🖤'
    }
  }
};
