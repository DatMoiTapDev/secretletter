import { saveVibeStore } from './vibeDb.js';

export function seedVibeStore(force = false) {
  console.log('Đang khởi tạo dữ liệu mẫu thực tế, cảm xúc cho Vibe Store...');

  const store = {
    // 1. GIÁNG SINH
    christmas: {
      id: 'christmas',
      name: 'Giáng Sinh Ấm Áp',
      emoji: '🎄',
      recipients: [
        {
          id: 'tu',
          name: 'Tú',
          aliases: ['tu', 'tú', 'anh tú', 'anh tu', 'tú béo'],
          letters: [
            {
              id: 'xmas-tu-1',
              keyTitle: '🗝️ Khóa 1: Lời Nhắn Mùa Đông',
              keyIcon: '☕',
              letterPassword: 'dongam',
              passwordHint: 'Cảm giác ngày đông ấm cúng của chúng mình (viết liền không dấu)',
              title: 'Một Mùa Đông Thật Dịu Dàng Dành Cho Tú',
              introQuote: 'Trời ngoài kia đã lạnh rồi, nhớ giữ ấm nhé Tú...',
              content: {
                greeting: 'Gửi Tú thân mến,',
                paragraphs: [
                  'Mùa đông năm nay đến thật nhanh. Những ngọn gió lạnh đầu mùa làm mình nhớ tới những buổi cà phê chuyện trò chẳng dứt của hai đứa.',
                  'Cảm ơn Tú vì đã luôn là một người bạn đáng tin cậy, luôn lắng nghe và mang lại năng lượng tích cực cho mọi người xung quanh.',
                  'Giáng sinh này, mong Tú luôn tìm thấy những niềm vui bình dị và những khoảng lặng ấm áp trong tim.'
                ],
                quotes: [
                  {
                    tag: '💭 Điều mình muốn nói',
                    text: 'Dù mùa đông ngoài kia có lạnh thế nào, chỉ cần có những người bạn chân thành, tim mình sẽ luôn ấm áp.'
                  }
                ]
              },
              photos: [
                {
                  url: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?auto=format&fit=crop&w=800&q=80',
                  caption: '📸 Cây thông lung linh bên góc phố quen',
                  layout: 'polaroid'
                }
              ],
              secretUnsaid: {
                enabled: true,
                prompt: '💌 Có một điều chưa từng nói với Tú...',
                buttonText: 'Mở bức thư nhỏ',
                content: 'Mình thật sự rất khâm phục sự kiên trì và tốt bụng của Tú. Đừng bao giờ nghi ngờ giá trị của bản thân nhé!'
              },
              finalThought: {
                enabled: true,
                prompt: 'Còn một điều cuối cùng...',
                content: 'Merry Christmas! Chúc Tú một mùa Giáng sinh ngập tràn tiếng cười và may mắn! 🎄❤️'
              },
              music: { type: 'preset', track: 'holiday_bells', defaultVolume: 0.3 }
            },
            {
              id: 'xmas-tu-2',
              keyTitle: '🗝️ Khóa 2: Kỷ Niệm Tuyết Rơi',
              keyIcon: '❄️',
              letterPassword: 'tuyettrang',
              passwordHint: 'Màu sắc của hoa tuyết đầu mùa',
              title: 'Những Khoảnh Khắc Đáng Nhớ Cùng Tú',
              introQuote: 'Có những kỷ niệm như bông tuyết trắng, mãi tinh khôi...',
              content: {
                greeting: 'Gửi Tú,',
                paragraphs: [
                  'Nhìn lại một năm đã qua, có biết bao kỷ niệm đẹp mà chúng ta đã cùng trải nghiệm.',
                  'Chiếc khóa thứ hai này chứa đựng toàn bộ sự trân quý của mình dành cho tình bạn đẹp đẽ này.'
                ],
                quotes: [
                  {
                    tag: '✨ Kỷ niệm',
                    text: 'Thời gian trôi qua, mọi thứ có thể đổi thay, nhưng tình bạn chân thành sẽ luôn ở lại.'
                  }
                ]
              },
              photos: [
                {
                  url: 'https://images.unsplash.com/photo-1543589077-47d81606c1bf?auto=format&fit=crop&w=800&q=80',
                  caption: '☕ Tách cacao nóng giữa chiều mùa đông',
                  layout: 'polaroid'
                }
              ],
              secretUnsaid: {
                enabled: true,
                prompt: '💌 Lời nhắn gửi riêng...',
                buttonText: 'Bóc mở',
                content: 'Năm mới sắp tới, hy vọng chúng ta sẽ cùng nhau tạo nên thêm thật nhiều kỷ niệm đáng nhớ hơn nữa!'
              },
              finalThought: {
                enabled: true,
                prompt: 'Còn một điều cuối cùng...',
                content: 'Chúc Tú luôn vững vàng và rạng rỡ trên con đường mình chọn! ❄️✨'
              },
              music: { type: 'preset', track: 'dreamy_piano', defaultVolume: 0.3 }
            }
          ]
        },
        {
          id: 'khue',
          name: 'Khuê',
          aliases: ['khue', 'khuê', 'ngoc khue', 'ngọc khuê', 'bé khuê', 'be khue'],
          letters: [
            {
              id: 'xmas-khue-1',
              keyTitle: '🗝️ Khóa 1: Gửi Cô Gái Tháng 12',
              keyIcon: '🌸',
              letterPassword: 'thang12',
              passwordHint: 'Tháng sinh nhật của bạn (viết liền)',
              title: 'Gửi Khuê - Cô Gái Của Những Điều Dịu Dàng',
              introQuote: 'Tháng 12 về mang theo một chút ngọt ngào dành riêng cho Khuê...',
              content: {
                greeting: 'Gửi Khuê thương mến,',
                paragraphs: [
                  'Khuê à, mùa đông năm nay có lạnh lắm không? Chiếc phong bì nhỏ này được gửi đi để sưởi ấm những ngày cuối năm của bạn đấy.',
                  'Khuê luôn có một nụ cười rất sáng và một trái tim ấm áp, luôn quan tâm đến mọi người xung quanh.',
                  'Mình mong rằng thế giới này sẽ luôn đối xử thật dịu dàng với Khuê, y như cách bạn đã luôn đối xử tử tế với cuộc đời.'
                ],
                quotes: [
                  {
                    tag: '🌱 Điều mình mong',
                    text: 'Mong Khuê mỗi sớm mai thức dậy đều thấy bình yên, và mỗi tối đi ngủ đều mỉm cười nhẹ nhõm.'
                  }
                ]
              },
              photos: [
                {
                  url: 'https://images.unsplash.com/photo-1482517967863-00e15c9b44be?auto=format&fit=crop&w=800&q=80',
                  caption: '✨ Một góc sáng lung linh dành tặng Khuê',
                  layout: 'polaroid'
                }
              ],
              secretUnsaid: {
                enabled: true,
                prompt: '💌 Có một bí mật nhỏ...',
                buttonText: 'Mở phần này',
                content: 'Mỗi khi nhìn thấy Khuê vui vẻ, ngày hôm đó của mình cũng bỗng nhiên tươi sáng hơn rất nhiều!'
              },
              finalThought: {
                enabled: true,
                prompt: 'Còn một điều cuối cùng...',
                content: 'Giáng sinh an lành nhé Khuê! Hãy luôn giữ nét hồn nhiên đáng yêu này nhé. ❤️🎄'
              },
              music: { type: 'preset', track: 'holiday_bells', defaultVolume: 0.3 }
            },
            {
              id: 'xmas-khue-2',
              keyTitle: '🗝️ Khóa 2: Chiếc Chuông Bí Mật',
              keyIcon: '🔔',
              letterPassword: 'noel',
              passwordHint: 'Tên ngày lễ ấm áp này (viết liền)',
              title: 'Những Lời Chúc Nhiệm Màu Dành Cho Khuê',
              introQuote: 'Khi tiếng chuông Noel vang lên, điều ước của Khuê sẽ thành hiện thực...',
              content: {
                greeting: 'Khuê thân mến,',
                paragraphs: [
                  'Chiếc khóa thứ hai này mở ra lời chúc đặc biệt nhất dành cho bạn.',
                  'Chúc Khuê một mùa đông ấm áp, không ốm vặt, ăn ngon ngủ kỹ và luôn ngập tràn may mắn!'
                ],
                quotes: [
                  {
                    tag: '❤️ Lời chúc',
                    text: 'Bạn là một món quà đặc biệt đối với những người yêu quý bạn.'
                  }
                ]
              },
              photos: [
                {
                  url: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?auto=format&fit=crop&w=800&q=80',
                  caption: '🔔 Tiếng chuông mang an lành',
                  layout: 'polaroid'
                }
              ],
              secretUnsaid: {
                enabled: true,
                prompt: '💌 Điều giấu kín...',
                buttonText: 'Bóc mở',
                content: 'Cảm ơn Khuê vì đã luôn là một người bạn tuyệt vời!'
              },
              finalThought: {
                enabled: true,
                prompt: 'Còn một điều cuối cùng...',
                content: 'Merry Christmas to Khuê! 🔔✨'
              },
              music: { type: 'preset', track: 'peaceful_acoustic', defaultVolume: 0.3 }
            }
          ]
        }
      ]
    },

    // 2. TẾT SUM VẦY
    tet: {
      id: 'tet',
      name: 'Tết Sum Vầy',
      emoji: '🧧',
      recipients: [
        {
          id: 'tu',
          name: 'Tú',
          aliases: ['tu', 'tú', 'anh tú', 'anh tu'],
          letters: [
            {
              id: 'tet-tu-1',
              keyTitle: '🗝️ Khóa 1: Lời Chúc Đầu Năm',
              keyIcon: '🏮',
              letterPassword: 'phattai',
              passwordHint: 'Lời chúc làm ăn may mắn ai cũng mong đầu xuân',
              title: 'Xuân Mới An Khang - Chúc Tú Vạn Sự Khởi Sắc',
              introQuote: 'Mùa xuân gõ cửa mang theo tài lộc và bình an...',
              content: {
                greeting: 'Chào Tú,',
                paragraphs: [
                  'Năm mới Tết đến, chúc Tú và gia đình dồi dào sức khỏe, công việc hanh thông và gặt hái được thật nhiều thành tựu mới rực rỡ.',
                  'Mỗi nỗ lực trong năm qua của Tú đều rất đáng ghi nhận, năm mới sẽ là lúc mọi trái ngọt nở rộ!'
                ],
                quotes: [
                  {
                    tag: '🧧 Lời chúc',
                    text: 'Vạn sự như ý - Tấn tài tấn lộc - Bình an phú quý!'
                  }
                ]
              },
              photos: [
                {
                  url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
                  caption: '🌸 Sắc xuân rạng ngời',
                  layout: 'polaroid'
                }
              ],
              secretUnsaid: {
                enabled: true,
                prompt: '💌 Lời nhắn đầu xuân...',
                buttonText: 'Mở phong bao đỏ',
                content: 'Năm nay hãy tự thưởng cho mình một chuyến du lịch thật thư giãn nhé Tú!'
              },
              finalThought: {
                enabled: true,
                prompt: 'Còn một điều cuối cùng...',
                content: 'Chúc mừng năm mới! Gia đình Tú luôn ấm êm và hạnh phúc! 🧧✨'
              },
              music: { type: 'preset', track: 'peaceful_acoustic', defaultVolume: 0.3 }
            }
          ]
        },
        {
          id: 'khue',
          name: 'Khuê',
          aliases: ['khue', 'khuê', 'ngoc khue'],
          letters: [
            {
              id: 'tet-khue-1',
              keyTitle: '🗝️ Khóa 1: Sắc Xuân May Mắn',
              keyIcon: '🌸',
              letterPassword: 'maivang',
              passwordHint: 'Loài hoa xuân rực rỡ phương Nam',
              title: 'Xuân Mới Thắm Nụ Cười - Gửi Khuê',
              introQuote: 'Cành đào thắm, cánh mai vàng và nụ cười rạng rỡ...',
              content: {
                greeting: 'Gửi Khuê thân yêu,',
                paragraphs: [
                  'Chúc mừng năm mới Khuê! Chúc Khuê tuổi mới luôn tươi trẻ, xinh đẹp, nhiều may mắn và ngập tràn năng lượng tích cực.',
                  'Mong rằng mùa xuân này sẽ mang đến cho Khuê nhiều cơ hội mới và những trải nghiệm ngọt ngào.'
                ],
                quotes: [
                  {
                    tag: '🧧 Khai xuân',
                    text: 'Mỗi ngày trôi qua trong năm mới đều rực rỡ như hoa xuân khoe sắc!'
                  }
                ]
              },
              photos: [
                {
                  url: 'https://images.unsplash.com/photo-1546272989-40c92939c6c2?auto=format&fit=crop&w=800&q=80',
                  caption: '🏮 Đèn lồng đỏ mang sắc xuân đoàn viên',
                  layout: 'polaroid'
                }
              ],
              secretUnsaid: {
                enabled: true,
                prompt: '💌 Lời chúc bí mật...',
                buttonText: 'Mở lì xì',
                content: 'Năm mới chúc Khuê tìm được những niềm đam mê mới và luôn hạnh phúc với lựa chọn của mình!'
              },
              finalThought: {
                enabled: true,
                prompt: 'Còn một điều cuối cùng...',
                content: 'Chúc Khuê năm mới vạn sự hanh thông và an yên tuyệt đối! 🧧🌸'
              },
              music: { type: 'preset', track: 'peaceful_acoustic', defaultVolume: 0.3 }
            }
          ]
        }
      ]
    },

    // 3. SINH NHẬT RỰC RỠ
    birthday: {
      id: 'birthday',
      name: 'Sinh Nhật Rực Rỡ',
      emoji: '🎂',
      recipients: [
        {
          id: 'tu',
          name: 'Tú',
          aliases: ['tu', 'tú', 'anh tú'],
          letters: [
            {
              id: 'sn-tu-1',
              keyTitle: '🗝️ Khóa 1: Ngọn Nến Tuổi Mới',
              keyIcon: '🎂',
              letterPassword: 'happy',
              passwordHint: 'Từ tiếng Anh thể hiện niềm vui hạnh phúc',
              title: 'Happy Birthday to Tú!',
              introQuote: 'Chúc mừng sinh nhật một người bạn vô cùng đặc biệt...',
              content: {
                greeting: 'Happy Birthday Tú! 🥳',
                paragraphs: [
                  'Thêm một tuổi mới, chúc Tú luôn giữ được ngọn lửa nhiệt huyết và tinh thần lạc quan.',
                  'Cảm ơn Tú vì đã luôn có mặt những lúc bạn bè cần nhất. Sinh nhật vui vẻ và bùng nổ nhé!'
                ],
                quotes: [
                  {
                    tag: '✨ Ước nguyện',
                    text: 'Chúc mọi ước mơ bạn ấp ủ đều sớm trở thành hiện thực rực rỡ.'
                  }
                ]
              },
              photos: [
                {
                  url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80',
                  caption: '🎉 Sinh nhật tuổi mới tưng bừng',
                  layout: 'polaroid'
                }
              ],
              secretUnsaid: {
                enabled: true,
                prompt: '💌 Điều ước bí mật...',
                buttonText: 'Thổi nến mở quà',
                content: 'Chúc Tú tuổi mới sớm đạt được mục tiêu lớn bạn đang hướng tới!'
              },
              finalThought: {
                enabled: true,
                prompt: 'Còn một điều cuối cùng...',
                content: 'Sinh nhật siêu vui và nhiều quà nhé Tú! 🎂🎈'
              },
              music: { type: 'preset', track: 'dreamy_piano', defaultVolume: 0.35 }
            }
          ]
        },
        {
          id: 'khue',
          name: 'Khuê',
          aliases: ['khue', 'khuê', 'ngoc khue'],
          letters: [
            {
              id: 'sn-khue-1',
              keyTitle: '🗝️ Khóa 1: Tuổi Mới Như Hoa',
              keyIcon: '🎈',
              letterPassword: 'xinhdep',
              passwordHint: 'Từ khen ngợi vẻ rạng ngời của bạn',
              title: 'Chúc Mừng Sinh Nhật Khuê 🎂',
              introQuote: 'Hôm nay là ngày đặc biệt của một cô gái vô cùng đặc biệt...',
              content: {
                greeting: 'Happy Birthday Khuê! 💖',
                paragraphs: [
                  'Chúc mừng sinh nhật cô gái dễ thương! Thêm một tuổi mới, chúc Khuê ngày càng rạng ngời, vui vẻ và luôn được yêu thương.',
                  'Mong rằng mỗi ngày của tuổi mới đều ngập tràn nụ cười và những bất ngờ ngọt ngào.'
                ],
                quotes: [
                  {
                    tag: '🌸 Lời chúc',
                    text: 'Chúc bạn tuổi mới xinh đẹp như hoa và tự do như ngọn gió!'
                  }
                ]
              },
              photos: [
                {
                  url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80',
                  caption: '🎂 Ánh nến lung linh chúc mừng sinh nhật',
                  layout: 'polaroid'
                }
              ],
              secretUnsaid: {
                enabled: true,
                prompt: '💌 Món quà bí mật...',
                buttonText: 'Mở hộp quà',
                content: 'Cảm ơn Khuê vì đã đem lại năng lượng tích cực cho tất cả mọi người!'
              },
              finalThought: {
                enabled: true,
                prompt: 'Còn một điều cuối cùng...',
                content: 'Sinh nhật thật hạnh phúc và ấm áp bên những người yêu thương nhé Khuê! 🎉❤️'
              },
              music: { type: 'preset', track: 'dreamy_piano', defaultVolume: 0.35 }
            }
          ]
        }
      ]
    },

    // 4. BẦU TRỜI ĐÊM TÂM TÌNH
    emotional: {
      id: 'emotional',
      name: 'Bầu Trời Tâm Tình',
      emoji: '🌙',
      recipients: [
        {
          id: 'tu',
          name: 'Tú',
          aliases: ['tu', 'tú'],
          letters: [
            {
              id: 'moon-tu-1',
              keyTitle: '🗝️ Khóa 1: Dưới Ánh Trăng Đêm',
              keyIcon: '🌙',
              letterPassword: 'stars',
              passwordHint: 'Những vì sao lấp lánh trên trời đêm (tiếng Anh)',
              title: 'Một Thoáng Lắng Đọng Gửi Tú',
              introQuote: 'Có những tâm sự chỉ dễ sẻ chia trong đêm tĩnh lặng...',
              content: {
                greeting: 'Chào Tú,',
                paragraphs: [
                  'Cuộc sống đôi khi thật bận rộn và nhiều áp lực. Nhưng hãy nhớ rằng sau một ngày dài mệt mỏi, luôn có những người bạn sẵn sàng lắng nghe bạn.',
                  'Cứ nghỉ ngơi thật tốt và nạp lại năng lượng nhé!'
                ],
                quotes: [
                  {
                    tag: '🌙 Tâm tình',
                    text: 'Bình yên không phải là không có giông bão, mà là sự tĩnh lặng trong tâm hồn.'
                  }
                ]
              },
              photos: [
                {
                  url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
                  caption: '🌌 Bầu trời đêm sâu thẳm',
                  layout: 'polaroid'
                }
              ],
              secretUnsaid: {
                enabled: true,
                prompt: '💌 Lời nhắn gửi...',
                buttonText: 'Mở ra',
                content: 'Bạn luôn làm rất tốt rồi, hãy tự hào về bản thân!'
              },
              finalThought: {
                enabled: true,
                prompt: 'Còn một điều cuối cùng...',
                content: 'Ngủ thật ngon nhé Tú. 🌙✨'
              },
              music: { type: 'preset', track: 'starry_ambient', defaultVolume: 0.28 }
            }
          ]
        },
        {
          id: 'khue',
          name: 'Khuê',
          aliases: ['khue', 'khuê'],
          letters: [
            {
              id: 'moon-khue-1',
              keyTitle: '🗝️ Khóa 1: Tiếng Thì Thầm Ngàn Sao',
              keyIcon: '⭐',
              letterPassword: 'binhyen',
              passwordHint: 'Hai chữ mà ai trong đời cũng kiếm tìm',
              title: 'Gửi Khuê Những Bình Yên Đêm Muộn',
              introQuote: 'Đêm nay trời nhiều sao lắm, tặng Khuê một bầu trời bình yên...',
              content: {
                greeting: 'Khuê à,',
                paragraphs: [
                  'Nếu có những lúc thấy mỏi mệt hoặc yếu lòng, hãy ngước nhìn lên bầu trời đêm nhé.',
                  'Ngàn vì sao vẫn luôn ở đó kiên nhẫn phát sáng, cũng như có những người vẫn luôn dõi theo và cầu chúc những điều tốt đẹp nhất cho bạn.'
                ],
                quotes: [
                  {
                    tag: '⭐ Tâm sự',
                    text: 'Hãy yêu thương bản thân mình nhiều hơn mỗi ngày.'
                  }
                ]
              },
              photos: [
                {
                  url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
                  caption: '🌌 Một bầu trời sao gửi đến Khuê',
                  layout: 'polaroid'
                }
              ],
              secretUnsaid: {
                enabled: true,
                prompt: '💌 Lời thì thầm...',
                buttonText: 'Lắng nghe',
                content: 'Khuê xứng đáng nhận được tất cả những điều dịu dàng nhất trên thế giới này.'
              },
              finalThought: {
                enabled: true,
                prompt: 'Còn một điều cuối cùng...',
                content: 'Chúc Khuê có những giấc mơ thật đẹp. 🌙💖'
              },
              music: { type: 'preset', track: 'starry_ambient', defaultVolume: 0.28 }
            }
          ]
        }
      ]
    },

    // 5. NGỌT NGÀO DỄ THƯƠNG
    cute: {
      id: 'cute',
      name: 'Ngọt Ngào Dễ Thương',
      emoji: '💕',
      recipients: [
        {
          id: 'tu',
          name: 'Tú',
          aliases: ['tu', 'tú'],
          letters: [
            {
              id: 'cute-tu-1',
              keyTitle: '🗝️ Khóa 1: Một Chút Kẹo Ngọt',
              keyIcon: '🍬',
              letterPassword: 'keongot',
              passwordHint: 'Món ăn ngọt ngào yêu thích',
              title: 'Một Chút Đáng Yêu Gửi Tú',
              introQuote: 'Tặng Tú chút kẹo ngọt cho ngày làm việc vui tươi...',
              content: {
                greeting: 'Gửi Tú,',
                paragraphs: [
                  'Cuộc sống nhiều khi hơi căng thẳng, gửi Tú một lá thư màu hồng pastel để F5 lại tâm trạng nè!',
                  'Cười nhiều lên nhé, vì nụ cười của Tú rất có duyên đấy!'
                ],
                quotes: [
                  { tag: '💕 Năng lượng', text: 'Mỗi ngày hãy tự thưởng cho mình một niềm vui nhỏ.' }
                ]
              },
              photos: [
                {
                  url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=800&q=80',
                  caption: '🌸 Một bông hoa nhỏ cho ngày rạng rỡ',
                  layout: 'polaroid'
                }
              ],
              secretUnsaid: {
                enabled: true,
                prompt: '💌 Có một điều dễ thương...',
                buttonText: 'Xem ngay',
                content: 'Tú là một người bạn siêu đáng mến!'
              },
              finalThought: {
                enabled: true,
                prompt: 'Còn một điều cuối cùng...',
                content: 'Chúc Tú một ngày ngập tràn năng lượng tích cực! 💕'
              },
              music: { type: 'preset', track: 'midnight_lofi', defaultVolume: 0.3 }
            }
          ]
        },
        {
          id: 'khue',
          name: 'Khuê',
          aliases: ['khue', 'khuê'],
          letters: [
            {
              id: 'cute-khue-1',
              keyTitle: '🗝️ Khóa 1: Chiếc Hộp Màu Hồng',
              keyIcon: '🎀',
              letterPassword: 'peace',
              passwordHint: 'Từ mang nghĩa bình yên trong tiếng Anh',
              title: 'Hộp Quà Dễ Thương Tặng Khuê',
              introQuote: 'Một chiếc phong bì màu hồng pastel gửi riêng cho Khuê...',
              content: {
                greeting: 'Khuê ơi,',
                paragraphs: [
                  'Hôm nay Khuê đã ăn ngon và uống đủ nước chưa nè?',
                  'Chúc cô bé luôn giữ được nét đáng yêu, nhí nhảnh và lan tỏa năng lượng vui vẻ đến mọi người xung quanh nhé!'
                ],
                quotes: [
                  { tag: '💕 Tặng Khuê', text: 'Khuê như một viên kẹo ngọt làm cho cuộc sống này dễ thương hơn.' }
                ]
              },
              photos: [
                {
                  url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=800&q=80',
                  caption: '🌸 Hoa hồng pastel tặng Khuê',
                  layout: 'polaroid'
                }
              ],
              secretUnsaid: {
                enabled: true,
                prompt: '💌 Bí mật nhỏ nè...',
                buttonText: 'Mở bí mật',
                content: 'Khuê là cô gái có nụ cười tỏa nắng nhất quả đất!'
              },
              finalThought: {
                enabled: true,
                prompt: 'Còn một điều cuối cùng...',
                content: 'Mãi luôn đáng yêu và hạnh phúc nhé Khuê ơi! 💕✨'
              },
              music: { type: 'preset', track: 'midnight_lofi', defaultVolume: 0.3 }
            }
          ]
        }
      ]
    },

    // 6. VUI NHỘN & HÀI HƯỚC
    funny: {
      id: 'funny',
      name: 'Vui Nhộn & Hài Hước',
      emoji: '🎉',
      recipients: [
        {
          id: 'tu',
          name: 'Tú',
          aliases: ['tu', 'tú'],
          letters: [
            {
              id: 'fun-tu-1',
              keyTitle: '🗝️ Khóa 1: Cười Rơi Răng',
              keyIcon: '😂',
              letterPassword: 'cuoi',
              passwordHint: 'Hành động bạn làm đẹp nhất mỗi ngày',
              title: 'Cảnh Báo Năng Lượng Vui Vẻ Cực Mạnh!',
              introQuote: 'Không đọc là tiếc ráng chịu nha Tú...',
              content: {
                greeting: 'Hế lô đồng chí Tú,',
                paragraphs: [
                  'Thấy đồng chí dạo này làm việc nghiêm túc quá mức cho phép nên tôi phải gửi ngay chiếc thư này để giải cứu!',
                  'Cười lên nào, vì nụ cười là 10 thang thuốc bổ đấy haha!'
                ],
                quotes: [
                  { tag: '😂 Triết lý', text: 'Đời ngắn lắm, hãy vui vẻ bất cứ khi nào có thể!' }
                ]
              },
              photos: [
                {
                  url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80',
                  caption: '🥳 Quẩy hết mình cùng anh em',
                  layout: 'polaroid'
                }
              ],
              secretUnsaid: {
                enabled: true,
                prompt: '💌 Bí mật động trời...',
                buttonText: 'Dám bấm không?',
                content: 'Thật ra bạn là người hài hước nhất nhóm rồi, đừng khiêm tốn nữa!'
              },
              finalThought: {
                enabled: true,
                prompt: 'Còn một điều cuối cùng...',
                content: 'Chúc Tú một ngày cười bể bụng và vui hết nấc! 🥳🎉'
              },
              music: { type: 'preset', track: 'dreamy_piano', defaultVolume: 0.3 }
            }
          ]
        },
        {
          id: 'khue',
          name: 'Khuê',
          aliases: ['khue', 'khuê'],
          letters: [
            {
              id: 'fun-khue-1',
              keyTitle: '🗝️ Khóa 1: Năng Lượng Tươi Vui',
              keyIcon: '🥳',
              letterPassword: 'vuituoi',
              passwordHint: 'Tâm trạng hồ hởi yêu đời của bạn',
              title: 'Khuê Ơi Cười Lên Nào!',
              introQuote: 'Một chiếc thư giải cứu tâm trạng dành riêng cho Khuê...',
              content: {
                greeting: 'Hế lô Khuê,',
                paragraphs: [
                  'Nếu hôm nay có gì làm Khuê chưa vui thì hãy vứt hết ra sau đầu nhé!',
                  'Một ngày trôi qua mà không cười thì thật là lãng phí đấy nè.'
                ],
                quotes: [
                  { tag: '✨ Vui vẻ', text: 'Cứ vui lên vì cuộc đời cho phép!' }
                ]
              },
              photos: [
                {
                  url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80',
                  caption: '🎉 Nụ cười rạng rỡ',
                  layout: 'polaroid'
                }
              ],
              secretUnsaid: {
                enabled: true,
                prompt: '💌 Bí mật nhỏ...',
                buttonText: 'Xem ngay',
                content: 'Khuê mà cười là xinh gấp 10 lần bình thường đấy!'
              },
              finalThought: {
                enabled: true,
                prompt: 'Còn một điều cuối cùng...',
                content: 'Chúc Khuê luôn luôn vui vẻ và ngập tràn tiếng cười! 🥳💛'
              },
              music: { type: 'preset', track: 'dreamy_piano', defaultVolume: 0.3 }
            }
          ]
        }
      ]
    },

    // 7. SANG TRỌNG & QUÝ PHÁI
    elegant: {
      id: 'elegant',
      name: 'Sang Trọng & Quý Phái',
      emoji: '🌸',
      recipients: [
        {
          id: 'tu',
          name: 'Tú',
          aliases: ['tu', 'tú'],
          letters: [
            {
              id: 'ele-tu-1',
              keyTitle: '🗝️ Khóa 1: Thiệp Mời Hoàng Gia',
              keyIcon: '⚜️',
              letterPassword: 'quyphai',
              passwordHint: 'Khí chất lịch thiệp của bạn',
              title: 'Tấm Thiệp Tri Ân Gửi Quý Bạn Tú',
              introQuote: 'Sự trân trọng và tao nhã nhất gửi tới bạn...',
              content: {
                greeting: 'Kính gửi Tú,',
                paragraphs: [
                  'Có những mối giao hảo theo thời gian càng thêm sâu sắc và quý giá.',
                  'Bức thư này được gửi đi với lòng biết ơn về sự đồng hành và hỗ trợ chân thành của Tú.'
                ],
                quotes: [
                  { tag: '⚜️ Trân quý', text: 'Sự tinh tế nằm ở sự tử tế và phong thái lịch thiệp.' }
                ]
              },
              photos: [
                {
                  url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
                  caption: '⚜️ Phong thái đĩnh đạc và tao nhã',
                  layout: 'polaroid'
                }
              ],
              secretUnsaid: {
                enabled: true,
                prompt: '💌 Lời tri ân...',
                buttonText: 'Mở thư nhung',
                content: 'Chúc Tú luôn giữ vững phong độ và khí chất của một người dẫn đầu!'
              },
              finalThought: {
                enabled: true,
                prompt: 'Còn một điều cuối cùng...',
                content: 'Kính chúc Tú vạn sự hưng vượng và thành công rực rỡ! ⚜️'
              },
              music: { type: 'preset', track: 'peaceful_acoustic', defaultVolume: 0.3 }
            }
          ]
        },
        {
          id: 'khue',
          name: 'Khuê',
          aliases: ['khue', 'khuê'],
          letters: [
            {
              id: 'ele-khue-1',
              keyTitle: '🗝️ Khóa 1: Nét Đẹp Đài Các',
              keyIcon: '👑',
              letterPassword: 'daicac',
              passwordHint: 'Khí chất thanh lịch tiểu thư của bạn',
              title: 'Gửi Khuê - Vẻ Đẹp Của Sự Tao Nhã',
              introQuote: 'Sự thanh cao và dịu dàng như hoa nở trong sương sớm...',
              content: {
                greeting: 'Kính gửi Khuê,',
                paragraphs: [
                  'Khuê luôn toát lên một phong thái rất thanh lịch, dịu dàng nhưng đầy bản lĩnh.',
                  'Chúc bạn một đời bình an, được nâng niu và luôn sống trọn vẹn với những ước mơ đẹp nhất.'
                ],
                quotes: [
                  { tag: '🌸 Khí chất', text: 'Vẻ đẹp tao nhã nhất chính là sự tự tin và lòng nhân hậu.' }
                ]
              },
              photos: [
                {
                  url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
                  caption: '🌸 Đóa hoa thanh tao quý phái',
                  layout: 'polaroid'
                }
              ],
              secretUnsaid: {
                enabled: true,
                prompt: '💌 Lời chúc trân quý...',
                buttonText: 'Mở phong bì lụa',
                content: 'Khuê luôn là đóa hoa rực rỡ và quý giá nhất!'
              },
              finalThought: {
                enabled: true,
                prompt: 'Còn một điều cuối cùng...',
                content: 'Kính chúc Khuê luôn rạng ngời và hạnh phúc viên mãn! 👑✨'
              },
              music: { type: 'preset', track: 'peaceful_acoustic', defaultVolume: 0.3 }
            }
          ]
        }
      ]
    },

    // 8. TỐI GIẢN HIỆN ĐẠI
    minimal: {
      id: 'minimal',
      name: 'Tối Giản Hiện Đại',
      emoji: '🖤',
      recipients: [
        {
          id: 'tu',
          name: 'Tú',
          aliases: ['tu', 'tú'],
          letters: [
            {
              id: 'min-tu-1',
              keyTitle: '🗝️ Khóa 1: Khoảng Lặng Tâm Hồn',
              keyIcon: '✉️',
              letterPassword: 'yen',
              passwordHint: 'Một chữ chỉ sự tĩnh lặng trong tâm',
              title: 'Một Thoáng Tĩnh Lặng Gửi Tú',
              introQuote: 'Không cầu kỳ, chỉ là những dòng chữ mộc mạc gửi Tú...',
              content: {
                greeting: 'Gửi Tú,',
                paragraphs: [
                  'Giữa những ồn ào của thế giới hiện đại, đôi khi điều quý giá nhất chỉ là một khoảng lặng để nhìn lại chính mình.',
                  'Hãy luôn tin vào con đường Tú đã chọn và giữ trọn sự chân thành vốn có nhé.'
                ],
                quotes: [
                  { tag: '🖤 Suy tưởng', text: 'Càng tối giản, tâm hồn càng tự do.' }
                ]
              },
              photos: [],
              secretUnsaid: {
                enabled: true,
                prompt: '💌 Dòng tin ngắn...',
                buttonText: 'Xem tiếp',
                content: 'Bình yên luôn ở trong tâm của bạn.'
              },
              finalThought: {
                enabled: true,
                prompt: 'Còn một điều cuối cùng...',
                content: 'An yên và vững vàng nhé Tú. 🖤'
              },
              music: { type: 'preset', track: 'starry_ambient', defaultVolume: 0.25 }
            }
          ]
        },
        {
          id: 'khue',
          name: 'Khuê',
          aliases: ['khue', 'khuê'],
          letters: [
            {
              id: 'min-khue-1',
              keyTitle: '🗝️ Khóa 1: Sự Mộc Mạc Tinh Khôi',
              keyIcon: '🤍',
              letterPassword: 'an',
              passwordHint: 'Chữ cái đầu tiên trong an yên',
              title: 'Gửi Khuê - Nốt Lặng Giữa Cuộc Sống',
              introQuote: 'Một bức thư mộc mạc không màu mè gửi riêng cho Khuê...',
              content: {
                greeting: 'Gửi Khuê,',
                paragraphs: [
                  'Không cần những lời hoa mỹ, chỉ muốn chúc Khuê mỗi ngày đều có những giây phút an yên thật sự.',
                  'Hãy lắng nghe trái tim mình và làm những điều khiến bạn hạnh phúc nhất.'
                ],
                quotes: [
                  { tag: '🤍 An yên', text: 'Hạnh phúc đơn giản là tâm an giữa đời vạn biến.' }
                ]
              },
              photos: [],
              secretUnsaid: {
                enabled: true,
                prompt: '💌 Lời nhắn gửi...',
                buttonText: 'Mở đọc',
                content: 'Luôn là chính mình nhé Khuê ơi.'
              },
              finalThought: {
                enabled: true,
                prompt: 'Còn một điều cuối cùng...',
                content: 'Chúc Khuê một đời bình an và thanh thản! 🤍'
              },
              music: { type: 'preset', track: 'starry_ambient', defaultVolume: 0.25 }
            }
          ]
        }
      ]
    }
  };

  saveVibeStore(store);
  console.log('✅ Đã nạp thành công bộ dữ liệu demo cho Vibe Store!');
}

// Chỉ chạy khi được gọi trực tiếp bằng lệnh (VD: node server/vibeSeed.js)
if (process.argv[1] && (process.argv[1].endsWith('vibeSeed.js') || process.argv[1].endsWith('vibeSeed'))) {
  seedVibeStore(true);
}
