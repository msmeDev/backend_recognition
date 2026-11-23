// Voting-phase shortlist: the only nominees that can receive a vote in each
// category. Ids are staff_all_view ids (see prisma/seed.ts). The frontend keeps
// the same list in frontend/lib/ballot.ts — keep the two in sync.

export interface ShortlistNominee {
  id: number;
  fullName: string;
}

export interface VoteCategory {
  key: string;        // category key used by the tally
  payloadKey: string; // field name in the POST /api/vote body
  column: BallotColumn;
  nominees: ShortlistNominee[];
}

export type BallotColumn =
  | 'bestStaffMaleId'
  | 'bestStaffFemaleId'
  | 'bestDressedMaleId'
  | 'bestDressedFemaleId'
  | 'mostSocialStaffId'
  | 'bestTeamPlayerId'
  | 'mostSupportiveStaffId'
  | 'risingStarId';

export const VOTE_CATEGORIES: VoteCategory[] = [
  {
    key: 'best_staff_male',
    payloadKey: 'best_staff_male_id',
    column: 'bestStaffMaleId',
    nominees: [
      { id: 4, fullName: 'David Adebayo' },
      { id: 33, fullName: 'Agalabri Jerry' },
      { id: 6, fullName: 'Efe Okogbare' },
    ],
  },
  {
    key: 'best_staff_female',
    payloadKey: 'best_staff_female_id',
    column: 'bestStaffFemaleId',
    nominees: [
      { id: 27, fullName: 'Omowumi Oyinloye' },
      { id: 3, fullName: 'Christianah Simeon' },
      { id: 8, fullName: 'Iyiola Olajide' },
    ],
  },
  {
    key: 'best_dressed_male',
    payloadKey: 'best_dressed_male_id',
    column: 'bestDressedMaleId',
    nominees: [
      { id: 11, fullName: 'John Animasahun' },
      { id: 19, fullName: 'Idiagbon Saadu Abdulrahman' },
      { id: 22, fullName: 'Mayowa Oguntola' },
    ],
  },
  {
    key: 'best_dressed_female',
    payloadKey: 'best_dressed_female_id',
    column: 'bestDressedFemaleId',
    nominees: [
      { id: 37, fullName: 'Eze Shulamite' },
      { id: 28, fullName: 'Oreva Aluta' },
      { id: 25, fullName: 'Oluwakemi Animasahun' },
    ],
  },
  {
    key: 'most_social_staff',
    payloadKey: 'most_social_staff_id',
    column: 'mostSocialStaffId',
    nominees: [
      { id: 15, fullName: 'Ayoola Olalekan' },
      { id: 31, fullName: 'Victor Olajide' },
    ],
  },
  {
    key: 'best_team_player',
    payloadKey: 'best_team_player_id',
    column: 'bestTeamPlayerId',
    nominees: [
      { id: 17, fullName: 'Kolapo Taofeeq' },
      { id: 36, fullName: 'Awoyinka Adenike Omolara' },
    ],
  },
  {
    key: 'most_supportive_staff',
    payloadKey: 'most_supportive_staff_id',
    column: 'mostSupportiveStaffId',
    nominees: [
      { id: 26, fullName: 'Oluwatosin Ogunsan' },
      { id: 7, fullName: 'Israel Dadoneye' },
    ],
  },
  {
    key: 'rising_star',
    payloadKey: 'rising_star_id',
    column: 'risingStarId',
    nominees: [
      { id: 38, fullName: 'Aquila Moses' },
      { id: 39, fullName: 'Isiah Johnson' },
    ],
  },
];
