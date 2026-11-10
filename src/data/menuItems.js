// Import the real dish photos so the starter menu renders them, not the placeholder.
// Files live in the project-root "menu pictures/" folder; paths are relative to src/data/.
import shoyuRamen from '../../menu pictures/shoyu ramen_n.png';
import salmonAburiRoll from '../../menu pictures/kuroneko_salmon_aburi_roll_1200x800.png';
import gyoza from '../../menu pictures/gyoza.png';
import californiaRoll from '../../menu pictures/kuroneko_california_roll_1200x800.png';
import ebiTempuraRoll from '../../menu pictures/kuroneko_ebi_tempura_roll_1200x800.png';
import hamachiSashimi from '../../menu pictures/hamachi sashimi_n.png';
import salmonSashimi from '../../menu pictures/salmon sashimi_n.png';
import tunaSashimi from '../../menu pictures/tuna sashimi_n.png';
import sabaSashimi from '../../menu pictures/saba sashimi_n.png';
import tonkotsuRamen from '../../menu pictures/tonkotsu ramen.png';
import misoRamen from '../../menu pictures/miso ramen.png';
import spicyMisoRamen from '../../menu pictures/spicy miso ramen_n.png';
import icedGenmaicha from '../../menu pictures/iced genmaicha.png';
import ramune from '../../menu pictures/iced ramune.png';
import chickenKaraage from '../../menu pictures/chicken karaage.png';
import agedashiTofu from '../../menu pictures/agedashi tofu.png';
import edamame from '../../menu pictures/edamame.png';
import unagiNigiri from '../../menu pictures/unagi nigiri.png';

// Starter menu: each requested food category begins with four or five dishes.
// Dishes without a photo on hand (Tuna Nigiri, Yuzu Soda, Matcha Latte) keep an
// empty picture so they show the accessible placeholder until images are added.
export const menuItems = [
  { id: 'dish-1', name: 'Shoyu Ramen', description: 'Clear soy broth, springy noodles, and tender chashu.', price: 68000, category: 'Ramen', available: true, picture: shoyuRamen },
  { id: 'dish-2', name: 'Tuna Nigiri', description: 'Fresh tuna over hand-pressed seasoned rice.', price: 54000, category: 'Sushi', available: true, picture: '' },
  { id: 'dish-3', name: 'Salmon Aburi Roll', description: 'Seared salmon roll finished with a savory glaze.', price: 58000, category: 'Sushi', available: true, picture: salmonAburiRoll },
  { id: 'dish-4', name: 'Gyoza (5 pcs)', description: 'Pan-seared dumplings served with dipping sauce.', price: 32000, category: 'Side dishes', available: true, picture: gyoza },
  { id: 'dish-5', name: 'California Roll', description: 'Crab, avocado, and cucumber rolled with seasoned rice.', price: 52000, category: 'Sushi', available: true, picture: californiaRoll },
  { id: 'dish-6', name: 'Ebi Tempura Roll', description: 'Crispy prawn tempura with cucumber and house sauce.', price: 62000, category: 'Sushi', available: true, picture: ebiTempuraRoll },
  { id: 'dish-7', name: 'Hamachi Sashimi', description: 'Five slices of delicately rich yellowtail.', price: 76000, category: 'Sashimi', available: true, picture: hamachiSashimi },
  { id: 'dish-8', name: 'Salmon Sashimi', description: 'Five slices of fresh salmon, served chilled.', price: 68000, category: 'Sashimi', available: true, picture: salmonSashimi },
  { id: 'dish-9', name: 'Tuna Sashimi', description: 'Five clean, buttery cuts of bluefin tuna.', price: 78000, category: 'Sashimi', available: true, picture: tunaSashimi },
  { id: 'dish-10', name: 'Saba Sashimi', description: 'Lightly cured mackerel with grated ginger.', price: 62000, category: 'Sashimi', available: true, picture: sabaSashimi },
  { id: 'dish-11', name: 'Tonkotsu Ramen', description: 'Slow-simmered pork broth with noodles and chashu.', price: 78000, category: 'Ramen', available: true, picture: tonkotsuRamen },
  { id: 'dish-12', name: 'Miso Ramen', description: 'Comforting miso broth topped with corn and scallions.', price: 70000, category: 'Ramen', available: true, picture: misoRamen },
  { id: 'dish-13', name: 'Spicy Miso Ramen', description: 'Miso broth with chili oil, noodles, and minced pork.', price: 74000, category: 'Ramen', available: true, picture: spicyMisoRamen },
  { id: 'dish-14', name: 'Yuzu Soda', description: 'Sparkling citrus drink with fragrant Japanese yuzu.', price: 28000, category: 'Drinks', available: true, picture: '' },
  { id: 'dish-15', name: 'Matcha Latte', description: 'Smooth green tea with lightly sweetened milk.', price: 32000, category: 'Drinks', available: true, picture: '' },
  { id: 'dish-16', name: 'Iced Genmaicha', description: 'Chilled toasted rice green tea, served unsweetened.', price: 24000, category: 'Drinks', available: true, picture: icedGenmaicha },
  { id: 'dish-17', name: 'Ramune', description: 'Classic Japanese marble soda, served ice cold.', price: 26000, category: 'Drinks', available: true, picture: ramune },
  { id: 'dish-18', name: 'Chicken Karaage', description: 'Japanese-style fried chicken with lemon.', price: 42000, category: 'Side dishes', available: true, picture: chickenKaraage },
  { id: 'dish-19', name: 'Agedashi Tofu', description: 'Crisp tofu in a warm, savory dashi broth.', price: 36000, category: 'Side dishes', available: true, picture: agedashiTofu },
  { id: 'dish-20', name: 'Edamame', description: 'Steamed young soybeans with flaky sea salt.', price: 26000, category: 'Side dishes', available: true, picture: edamame },
  { id: 'dish-21', name: 'Unagi Nigiri', description: 'Grilled eel glazed with sweet soy on seasoned rice.', price: 64000, category: 'Sushi', available: true, picture: unagiNigiri },
];
