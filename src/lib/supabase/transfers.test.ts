import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transferTeamToOrg } from './transfers';
import { supabase } from '../supabaseClient';

// Mock the Supabase client
vi.mock('../supabaseClient', () => ({
  supabase: {
    rpc: vi.fn()
  }
}));

describe('transferTeamToOrg', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully transfer a team to a new organization', async () => {
    // Mock successful response
    const mockRpcResponse = {
      data: {
        team: { team_id: 123, org_id: 456, name: 'Test Team' },
        students: [
          { student_event_id: 1, person: { first_name: 'John', last_name: 'Doe' } },
          { student_event_id: 2, person: { first_name: 'Jane', last_name: 'Smith' } }
        ],
        student_count: 2,
        old_org_id: 789,
        new_org_id: 456
      },
      error: null
    };

    vi.mocked(supabase.rpc).mockResolvedValue(mockRpcResponse);

    const result = await transferTeamToOrg(123, 456);

    // Verify RPC was called with correct parameters
    expect(supabase.rpc).toHaveBeenCalledWith(
      'transfer_team_to_organization',
      {
        p_team_id: 123,
        p_new_org_id: 456
      }
    );

    // Verify result
    expect(result).toEqual({
      team: mockRpcResponse.data.team,
      students: mockRpcResponse.data.students
    });
  });

  it('should handle insufficient capacity errors', async () => {
    // Mock a Supabase database error for insufficient capacity
    const capacityError = {
      message: 'Organization does not have enough capacity. Needs 5 more seats for this transfer.',
      code: 'INSUFFICIENT_CAPACITY',
      details: 'Current usage: 15, Capacity: 20, Students to transfer: 10, Shortage: 5'
    };
    
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: capacityError
    });

    // Expect the function to throw the database error
    await expect(transferTeamToOrg(123, 456)).rejects.toEqual(capacityError);
  });

  it('should handle team not found errors', async () => {
    // Mock a Supabase database error for team not found
    const teamError = {
      message: 'Team not found (ID: 999)',
      code: 'TEAM_NOT_FOUND'
    };
    
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: teamError
    });

    await expect(transferTeamToOrg(999, 456)).rejects.toEqual(teamError);
  });

  it('should handle organization not found errors', async () => {
    // Mock a Supabase database error for organization not found
    const orgError = {
      message: 'Target organization not found (ID: 999)',
      code: 'ORG_NOT_FOUND'
    };
    
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: orgError
    });

    await expect(transferTeamToOrg(123, 999)).rejects.toEqual(orgError);
  });

  it('should handle unexpected RPC errors', async () => {
    // Mock a general database error
    const dbError = new Error('Database connection error');
    vi.mocked(supabase.rpc).mockRejectedValue(dbError);

    await expect(transferTeamToOrg(123, 456)).rejects.toThrow('Database connection error');
  });
}); 